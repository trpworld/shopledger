'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { getSettings } from '@/app/actions/settings'

export async function createOrder(cart: any[], paymentMode: string, clientTotalAmount: number, customerId?: string | null, promoCode?: string | null) {
    console.log('[createOrder] Starting...')
    console.log('[createOrder] Cart Size:', cart.length)
    console.log('[createOrder] Payment:', paymentMode, 'Total:', clientTotalAmount)

    const session = await getSession()
    if (!session) {
        console.error('[createOrder] No Session')
        return { error: 'Unauthorized: No Session' }
    }
    console.log('[createOrder] Session User:', session.user.id, session.user.role)

    if (session.user.role !== 'OWNER' && session.user.role !== 'CASHIER') {
        return { error: 'Unauthorized: Helpers cannot perform billing.' }
    }

    // 0. Idempotency Check (Prevent Double Submit)
    // Check for an order by this user, with exact same amount, created in last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000)
    const recentDuplicate = await db.order.findFirst({
        where: {
            userId: session.user.id,
            totalAmount: clientTotalAmount, // We use client amount for quick check, or re-calc expected server total if needed. 
            // Better to use a fuzzy time check.
            createdAt: { gte: fiveSecondsAgo }
        },
        orderBy: { createdAt: 'desc' }
    })

    if (recentDuplicate) {
        console.log('Idempotency hit: Returning existing order', recentDuplicate.id)
        return { success: true, orderId: recentDuplicate.id }
    }

    try {
        const order = await db.$transaction(async (tx: any) => {
            // 1. Fetch all products
            const productIds = cart.map((item: any) => item.id)
            const dbProducts = await tx.product.findMany({
                where: { id: { in: productIds } }
            })

            const productMap = new Map<string, typeof dbProducts[0]>()
            dbProducts.forEach((p: any) => productMap.set(p.id, p))

            // 2. Prepare Order Items & Calculate Server-Side Total
            let serverTotal = 0
            const orderItemsData = []

            for (const item of cart) {
                const product = productMap.get(item.id)
                if (!product) throw new Error(`Product ${item.id} not found`)

                // STRICT FINANCIALS: Use values from DB only
                const price = product.priceSell
                const buyPrice = product.priceBuy
                const gstRate = product.gstRate
                const quantity = item.qty

                // --- STOCK VALIDATION ---
                if (product.stock < quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`)
                }

                serverTotal += (price * quantity)

                orderItemsData.push({
                    productId: item.id,
                    quantity: quantity,
                    price: price,       // Strict Selling Price
                    buyPrice: buyPrice, // Strict Cost Snapshot
                    gstRate: gstRate    // Strict Tax Snapshot
                })
            }

            // 2.5 Server-side discount calculation
            const settings = await getSettings()
            let finalDiscountAmount = 0;
            let finalDiscountPercentage = 0;

            if (promoCode) {
                const offer = await tx.offer.findUnique({
                    where: { code: promoCode.toUpperCase() }
                });
                if (offer && offer.isActive && new Date(offer.validTill) > new Date()) {
                    finalDiscountPercentage = offer.discountPercentage;
                    finalDiscountAmount = Number(((serverTotal * finalDiscountPercentage) / 100).toFixed(2));
                }
            } else if (settings.AUTO_DISCOUNT_ENABLED === 'true') {
                const threshold = parseFloat(settings.AUTO_DISCOUNT_THRESHOLD || '5000');
                if (serverTotal >= threshold) {
                    finalDiscountPercentage = parseFloat(settings.AUTO_DISCOUNT_PERCENTAGE || '2');
                    finalDiscountAmount = Number(((serverTotal * finalDiscountPercentage) / 100).toFixed(2));
                }
            }

            // Apply the discount to the server calculated total
            serverTotal = Number((serverTotal - finalDiscountAmount).toFixed(2));

            // Strict Validation vs Client
            // Allow 1.0 epsilon for floating point issues only. If more, strict reject!
            if (Math.abs(serverTotal - clientTotalAmount) > 1.0) {
                throw new Error(`Price mismatch. Client reported: ${clientTotalAmount}, Server calculated: ${serverTotal}`);
            }

            // 3. Simple Order ID Generation
            const resetDaily = settings.RESET_ORDER_DAILY === 'true'

            let nextIdStr = "1"

            // Get the most recent order to parse its ID
            const lastOrder = await tx.order.findFirst({
                orderBy: { createdAt: 'desc' }
            })

            if (lastOrder) {
                const lastIdNum = parseInt(lastOrder.id, 10)

                if (resetDaily) {
                    // Check if last order was today
                    const today = new Date()
                    const lastOrderDate = new Date(lastOrder.createdAt)

                    if (
                        today.getDate() !== lastOrderDate.getDate() ||
                        today.getMonth() !== lastOrderDate.getMonth() ||
                        today.getFullYear() !== lastOrderDate.getFullYear()
                    ) {
                        nextIdStr = "1" // New Day, reset to 1
                    } else if (!isNaN(lastIdNum)) {
                        nextIdStr = (lastIdNum + 1).toString()
                    }
                } else if (!isNaN(lastIdNum)) {
                    // Lifetime counting
                    nextIdStr = (lastIdNum + 1).toString()
                }
            }

            // 4. Create Order
            const newOrder = await tx.order.create({
                data: {
                    id: nextIdStr, // Override UUID with simple number string
                    totalAmount: serverTotal, // Trust Server
                    paymentMode,
                    userId: session.user.id,
                    discountAmount: finalDiscountAmount,
                    discountPercentage: finalDiscountPercentage,
                    ...(customerId ? { customerId } : {}),
                    items: {
                        create: orderItemsData
                    }
                }
            })

            // 4. Update Stock & Log
            for (const item of cart) {
                await tx.product.update({
                    where: { id: item.id },
                    data: { stock: { decrement: item.qty } }
                })

                await tx.stockLog.create({
                    data: {
                        productId: item.id,
                        change: -item.qty,
                        reason: 'SALE',
                    }
                })
            }

            // 6. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'CREATE_ORDER',
                    details: JSON.stringify({ orderId: newOrder.id, amount: serverTotal, items: cart.length, customerId: customerId || null })
                }
            })

            console.log('[createOrder] Transaction Complete. Order ID:', newOrder.id)
            return newOrder
        })

        console.log('[createOrder] Revalidating paths...')
        try {
            revalidatePath('/pos')
            revalidatePath('/dashboard/products')
            revalidatePath('/dashboard/sales')
        } catch (revalError) {
            console.error('[createOrder] Revalidation Error:', revalError)
            // Do not fail the order just because revalidation failed
        }

        console.log('[createOrder] Success returning.')
        return { success: true, orderId: order.id }
    } catch (error) {
        console.error('[createOrder] Transaction Error:', error)
        return { error: 'Transaction failed' }
    }
}
