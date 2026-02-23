import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const [orders, customers, products] = await Promise.all([
            db.order.findMany({ include: { items: true } }),
            db.customer.findMany(),
            db.product.findMany()
        ])

        const backupData = {
            timestamp: new Date().toISOString(),
            data: { orders, customers, products }
        }

        const jsonString = JSON.stringify(backupData, null, 2)
        const fileBuffer = Buffer.from(jsonString, 'utf-8')

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="shopledger-backup-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to generate backup: ' + e.message }, { status: 500 })
    }
}
