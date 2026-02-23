import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { name, barcode, priceBuy, priceSell, stock, gstRate, category } = body

        const product = await db.product.update({
            where: { id },
            data: {
                name,
                barcode,
                priceBuy: parseFloat(priceBuy),
                priceSell: parseFloat(priceSell),
                stock: parseInt(stock),
                gstRate: parseFloat(gstRate),
                category
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        // Soft delete usually better, but for now actual delete or status update
        // Schema has isActive, so we should set isActive = false
        await db.product.update({
            where: { id },
            data: { isActive: false }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
