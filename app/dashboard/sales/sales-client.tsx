'use client'

import { useState } from 'react'
import styles from './sales.module.css'

type Order = {
    id: string
    totalAmount: number
    paymentMode: string
    createdAt: string
    user: { name: string }
    items: { product: { name: string }, quantity: number, price: number }[]
}

export default function SalesClient({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState(initialOrders)
    const [filterDate, setFilterDate] = useState('')
    const [filterMode, setFilterMode] = useState('ALL')

    const filteredOrders = orders.filter(order => {
        const matchesDate = filterDate ? order.createdAt.startsWith(filterDate) : true
        const matchesMode = filterMode === 'ALL' ? true : order.paymentMode === filterMode
        return matchesDate && matchesMode
    })

    const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    function exportCSV() {
        const headers = ['Order ID', 'Date', 'Amount', 'Payment Mode', 'Staff', 'Items']
        const rows = filteredOrders.map(o => [
            o.id.slice(0, 8),
            new Date(o.createdAt).toLocaleString(),
            o.totalAmount,
            o.paymentMode,
            o.user.name,
            o.items.map(i => `${i.product.name} (${i.quantity})`).join('; ')
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "sales_report.csv")
        document.body.appendChild(link)
        link.click()
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className={styles.input}
                />
                <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className={styles.select}>
                    <option value="ALL">All Modes</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                </select>
                <button onClick={exportCSV} className={styles.exportBtn}>Export CSV</button>
            </div>

            <div className={styles.summary}>
                <h3>Total Revenue: ₹{totalSales.toFixed(2)}</h3>
                <p>{filteredOrders.length} orders found</p>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>ID</th>
                        <th>Items</th>
                        <th>Mode</th>
                        <th>Staff</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                            <td>{order.id.slice(0, 8)}</td>
                            <td title={order.items.map(i => i.product.name).join(', ')}>
                                {order.items.length} items
                            </td>
                            <td>{order.paymentMode}</td>
                            <td>{order.user.name}</td>
                            <td>₹{order.totalAmount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
