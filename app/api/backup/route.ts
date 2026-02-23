import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import fs from 'fs'
import path from 'path'

export async function GET() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ error: 'Database file not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(dbPath)

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'application/x-sqlite3',
            'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.db"`,
        },
    })
}
