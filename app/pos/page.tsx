import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getSettings } from '@/app/actions/settings'
import POSClient from './pos-client'

export default async function POSPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    // REDESIGN: Owners are allowed to access POS for audit/testing, but Dashboard is primary.
    // if (session.user.role === 'OWNER') {
    //    redirect('/dashboard')
    // }

    const isOwner = session.user.role === 'OWNER'

    const products = await db.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            barcode: true,
            priceSell: true,
            stock: true,
            gstRate: true,
            image: true,
            // SECURITY: Only Owners can see Buy Price
            ...(isOwner ? { priceBuy: true } : {})
        }
    })

    // Serialize Prisma data to Ensure Plain Objects
    const serializedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        priceSell: Number(p.priceSell),
        stock: p.stock,
        gstRate: Number(p.gstRate),
        image: p.image,
        // Only include priceBuy if it was selected (i.e., if Owner)
        ...((p as any).priceBuy ? { priceBuy: Number((p as any).priceBuy) } : {})
    }))

    const settings = await getSettings()

    return (
        <POSClient
            initialProducts={serializedProducts}
            userRole={session.user.role}
            shopSettings={{
                name: settings.SHOP_NAME,
                upiId: settings.UPI_ID,
                autoDiscountEnabled: settings.AUTO_DISCOUNT_ENABLED === 'true',
                autoDiscountThreshold: Number(settings.AUTO_DISCOUNT_THRESHOLD),
                autoDiscountPercentage: Number(settings.AUTO_DISCOUNT_PERCENTAGE)
            }}
        />
    )
}
