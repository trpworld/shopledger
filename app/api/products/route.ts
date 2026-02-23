import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where = search
        ? {
            OR: [
                { name: { contains: search } },
                { barcode: { contains: search } },
            ],
        }
        : {}

    const products = await db.product.findMany({
        where,
        orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, barcode, category, priceBuy, priceSell, gstRate, stock } = body

        const product = await db.product.create({
            data: {
                name,
                barcode,
                category,
                priceBuy: parseFloat(priceBuy),
                priceSell: parseFloat(priceSell),
                gstRate: parseFloat(gstRate),
                stock: parseInt(stock),
            },
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
    }
}
