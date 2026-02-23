import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import SalesClient from './sales-client'

export default async function SalesPage() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') redirect('/login')

    // We'll fetch all orders and let client filter for small shop scale (or server search params)
    // For < 1000 orders/month, client side is instant.
    // I'll fetch last 1000 orders or use search params.
    // Better to use server params for scalability.

    const orders = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500, // Limit for now
        include: { items: { include: { product: true } }, user: true }
    })

    // Serialize dates for client component
    const serializedOrders = orders.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        items: o.items.map(i => ({ ...i, product: { ...i.product, createdAt: i.product.createdAt.toISOString(), updatedAt: i.product.updatedAt.toISOString() } })),
        user: { ...o.user, createdAt: o.user.createdAt.toISOString(), updatedAt: o.user.updatedAt.toISOString() }
    }))

    return (
        <div>
            <h1>Sales Reports</h1>
            <SalesClient initialOrders={serializedOrders} />
        </div>
    )
}
