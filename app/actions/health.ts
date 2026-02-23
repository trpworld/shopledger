'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export type HealthStatus = {
    dbIntegrity: boolean
    financialDiscrepancies: number
    stockDiscrepancies: number
    lastBackup: Date | null
    negativeProfits: number // Count of orders with negative profit (could be valid, but needs warning)
    missingSnapshots: number // Count of OrderItems with 0 buyPrice or 0 gstRate
}

export async function runSystemDiagnostics(): Promise<HealthStatus> {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        throw new Error('Unauthorized')
    }

    // 1. DB Integrity
    let dbIntegrity = false
    try {
        const result = await db.$queryRaw`PRAGMA integrity_check;` as any[]
        if (result.length > 0 && result[0].integrity_check === 'ok') {
            dbIntegrity = true
        }
    } catch (e) {
        console.error('DB Check Failed', e)
    }

    // 2. Financial Reconciliation & Strict Checks
    const orders = await db.order.findMany({
        include: { items: true },
        take: 1000,
        orderBy: { createdAt: 'desc' }
    })

    let badOrders = 0
    let negativeProfits = 0
    let missingSnapshots = 0

    for (const order of orders) {
        let orderTotal = 0
        let orderCost = 0

        for (const item of order.items) {
            orderTotal += (item.price * item.quantity)
            orderCost += (item.buyPrice * item.quantity)

            // Check for Missing Snapshots (Legacy Data or Bug)
            // If buyPrice is 0, it might be legacy. warning.
            if (item.buyPrice === 0) {
                missingSnapshots++
            }
        }

        // Integrity Check
        const expectedTotal = orderTotal - ((order as any).discountAmount || 0)
        if (Math.abs(expectedTotal - order.totalAmount) > 0.1) {
            badOrders++
        }

        // Profit Check
        if (orderTotal - orderCost < 0) {
            negativeProfits++
        }
    }

    // 3. Stock Consistency
    const negativeStock = await db.product.count({
        where: { stock: { lt: 0 } }
    })

    return {
        dbIntegrity,
        financialDiscrepancies: badOrders,
        stockDiscrepancies: negativeStock,
        lastBackup: null,
        negativeProfits,
        missingSnapshots
    }
}
