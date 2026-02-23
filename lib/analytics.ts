import { db } from '@/lib/db'
import { roundMoney } from '@/lib/format'

export type DailySalesStats = {
    date: string
    totalSales: number
    totalOrders: number
    totalProfit: number
}

// 1. Daily Sales Report (Last 30 Days)
export async function getDailySalesStats(): Promise<DailySalesStats[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const orders = await db.order.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo }
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' }
    })

    const statsMap = new Map<string, DailySalesStats>()

    for (const order of orders) {
        const dateKey = order.createdAt.toISOString().split('T')[0]

        if (!statsMap.has(dateKey)) {
            statsMap.set(dateKey, { date: dateKey, totalSales: 0, totalOrders: 0, totalProfit: 0 })
        }

        const stat = statsMap.get(dateKey)!
        stat.totalSales = roundMoney(stat.totalSales + order.totalAmount)
        stat.totalOrders += 1

        let orderProfit = 0
        for (const item of order.items) {
            const cost = roundMoney(item.buyPrice * item.quantity)
            const revenue = roundMoney(item.price * item.quantity)
            orderProfit = roundMoney(orderProfit + (revenue - cost))
        }
        // Deduct the overall order discount from the total profit
        orderProfit = roundMoney(orderProfit - (order.discountAmount || 0))

        stat.totalProfit = roundMoney(stat.totalProfit + orderProfit)
    }

    return Array.from(statsMap.values())
}

// 2. GST Summary (All Time)
export async function getGSTSummary() {
    const items = await db.orderItem.findMany()

    const summary = {
        totalGST: 0,
        breakdown: {} as Record<string, number>
    }

    for (const item of items) {
        const revenue = roundMoney(item.price * item.quantity)
        // Inclusive Tax Formula: Tax = Price - (Price / (1 + Rate/100))
        const taxAmount = roundMoney(revenue - (revenue / (1 + item.gstRate / 100)))

        summary.totalGST = roundMoney(summary.totalGST + taxAmount)

        const label = `${item.gstRate}%`
        summary.breakdown[label] = roundMoney((summary.breakdown[label] || 0) + taxAmount)
    }

    return summary
}

// 3. CA Export Data (Detailed)
export async function getDetailedexportData() {
    const orders = await db.order.findMany({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5000 // Reasonable limit for extract
    })

    return orders.flatMap(order =>
        order.items.map(item => {
            const revenue = roundMoney(item.price * item.quantity)
            const cost = roundMoney(item.buyPrice * item.quantity)
            const tax = roundMoney(revenue - (revenue / (1 + item.gstRate / 100)))
            const profit = roundMoney(revenue - cost) // Profit includes Tax component in margin usually? 
            // Wait, Profit = Revenue (excl tax) - Cost? Or Revenue (incl tax) - Cost?
            // "Profit = Selling Price - Buy Price". 
            // In POS, Selling Price usually includes Tax. So actual profit is less if we pay tax.
            // But User Rule: "Profit calculation must use: sellingPrice - buyPrice".
            // We will stick to User Rule literally for now. 
            // If User meant Net Profit (Excl Tax), they would specify.
            // However, accounting-wise, Profit = (Revenue - Tax) - Cost.
            // Let's adhere to "SellingPrice - BuyPrice" as requested, but maybe add a Net Profit column?
            // User: "Profit calculation must use: sellingPrice - buyPrice (per item)" -> literal.

            // Let's provide "Gross Profit" as per user rule.

            return {
                date: order.createdAt.toISOString().split('T')[0],
                orderId: order.id,
                productName: item.product.name,
                barcode: item.product.barcode,
                quantity: item.quantity,
                sellPrice: item.price,
                buyPrice: item.buyPrice,
                gstRate: item.gstRate,
                gstAmount: tax,
                total: revenue, // Item Total
                profit: profit
            }
        })
    )
}

// 4. Closing Summary
export async function getClosingSummary() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
        where: { createdAt: { gte: today } },
        include: { items: true }
    })

    let cashSales = 0
    let upiSales = 0
    let totalSales = 0
    let totalProfit = 0

    for (const o of orders) {
        totalSales = roundMoney(totalSales + o.totalAmount)
        if (o.paymentMode === 'CASH') cashSales = roundMoney(cashSales + o.totalAmount)
        else upiSales = roundMoney(upiSales + o.totalAmount)

        let orderProfit = 0
        for (const item of o.items) {
            const cost = roundMoney(item.buyPrice * item.quantity)
            const revenue = roundMoney(item.price * item.quantity)
            orderProfit = roundMoney(orderProfit + (revenue - cost))
        }

        // Deduct discount from the day's total profit
        orderProfit = roundMoney(orderProfit - (o.discountAmount || 0))
        totalProfit = roundMoney(totalProfit + orderProfit)
    }

    return {
        totalSales,
        cashSales,
        upiSales,
        totalProfit
    }
}

// 5. Top Products
export async function getTopProducts(limit = 5) {
    const items = await db.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit
    })

    const enriched = await Promise.all(items.map(async (i) => {
        const product = await db.product.findUnique({ where: { id: i.productId } })
        return {
            name: product?.name || 'Unknown',
            qty: i._sum.quantity || 0
        }
    }))

    return enriched
}

export type IntegrityStatus = {
    status: 'MATCH' | 'MISMATCH'
    revenueDiff: number
    orderCount: number
}

export async function verifySystemIntegrity() {
    // 1. Fetch All Orders & Items
    // For small shops, fetching all order items is ok. For large scale, we would do SUM() in DB.
    // Prisma aggregate is better.

    const dbTotal = await db.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true }
    })

    // Calculate sum of items manually or via aggregate
    // Note: SQLite might have floating point diffs if we sum in DB vs JS.
    // Let's use JS with roundMoney to be safe and match our logic.

    const orders = await db.order.findMany({
        include: { items: true }
    })

    let totalRevenue = 0
    let totalItemSum = 0

    for (const order of orders) {
        totalRevenue = roundMoney(totalRevenue + order.totalAmount)

        let orderItemSum = 0
        for (const item of order.items) {
            orderItemSum = roundMoney(orderItemSum + (item.price * item.quantity))
        }

        // Subtract the order-level discount from the aggregated item sum
        // to match the final discounted totalAmount paid by the customer.
        const expectedTotal = roundMoney(orderItemSum - (order.discountAmount || 0))

        totalItemSum = roundMoney(totalItemSum + expectedTotal)
    }

    const diff = roundMoney(Math.abs(totalRevenue - totalItemSum))

    return {
        status: diff < 0.1 ? 'MATCH' : 'MISMATCH',
        revenueDiff: diff,
        orderCount: orders.length
    }
}
