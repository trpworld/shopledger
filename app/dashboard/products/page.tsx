import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProductClientObject from './product-client'

export default async function ProductsPage() {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user.role !== 'OWNER' && session.user.role !== 'HELPER') redirect('/login')
    const products = await db.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    })

    // We pass data to a client component to handle search/filtering and modal state
    return (
        <div>
            <ProductClientObject initialProducts={products} userRole={session.user.role} />
        </div>
    )
}
