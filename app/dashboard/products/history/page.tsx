import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import styles from './history.module.css'

export default async function StockHistoryPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
    const session = await getSession()
    if (!session || (session.user.role !== 'OWNER' && session.user.role !== 'HELPER')) redirect('/login')

    const { productId } = await searchParams
    const where = productId ? { productId } : {}

    const logs = await db.stockLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: true }
    })

    return (
        <div className={styles.container}>
            <h1>Stock History {productId ? '- Product View' : ''}</h1>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Product</th>
                        <th>Change</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td>{log.createdAt.toLocaleString()}</td>
                            <td>{log.product.name}</td>
                            <td className={log.change > 0 ? styles.pos : styles.neg}>
                                {log.change > 0 ? '+' : ''}{log.change}
                            </td>
                            <td>{log.reason}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
