'use client'

import styles from './reports.module.css'
import { formatMoney } from '@/lib/format'

type PropDaily = {
    date: string
    totalSales: number
    totalOrders: number
    totalProfit: number
}

type PropDetailed = {
    date: string
    orderId: string
    productName: string
    barcode: string
    quantity: number
    sellPrice: number
    buyPrice: number
    gstRate: number
    gstAmount: number
    total: number
    profit: number
}

type Props = {
    dailyStats: PropDaily[]
    gstStats: {
        totalGST: number
        breakdown: Record<string, number>
    }
    closingStats: {
        totalSales: number
        cashSales: number
        upiSales: number
        totalProfit: number
    }
    topProducts: { name: string, qty: number }[]
    detailedExport: PropDetailed[]
}

export default function ReportsClient({ dailyStats, gstStats, closingStats, topProducts, detailedExport }: Props) {

    // Simple Summary CSV
    const downloadSummaryCSV = () => {
        const header = 'Date,Orders,Sales,Profit\n'
        const rows = dailyStats.map(d => `${d.date},${d.totalOrders},${d.totalSales},${d.totalProfit}`).join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'daily_summary.csv'
        a.click()
    }

    // Detailed CA Export
    const downloadDetailedCSV = () => {
        const header = 'Date,OrderId,Product,Barcode,Qty,SellPrice,BuyPrice,GSTRate,GSTAmount,Total,Profit\n'
        const rows = detailedExport.map(d =>
            `${d.date},${d.orderId},"${d.productName}",${d.barcode},${d.quantity},${d.sellPrice},${d.buyPrice},${d.gstRate},${d.gstAmount},${d.total},${d.profit}`
        ).join('\n')

        const blob = new Blob([header + rows], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'detailed_ca_report.csv'
        a.click()
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>System Reports</h1>
                <div className={styles.actions}>
                    <button onClick={downloadSummaryCSV} className={styles.exportBtn}>Summary CSV</button>
                    <button onClick={downloadDetailedCSV} className={styles.exportBtn} style={{ background: '#059669', marginLeft: '10px' }}>CA Export (Detailed)</button>
                </div>
            </div>

            {/* Closing Summary */}
            <div className={styles.section}>
                <h2>Today's Closing</h2>
                <div className={styles.summaryGrid}>
                    <div className={styles.card}>
                        <h3>Sales</h3>
                        <div className={styles.value}>{formatMoney(closingStats.totalSales)}</div>
                    </div>
                    <div className={styles.card}>
                        <h3>Profit</h3>
                        <div className={styles.value} style={{ color: 'green' }}>{formatMoney(closingStats.totalProfit)}</div>
                    </div>
                    <div className={styles.card}>
                        <h3>Cash</h3>
                        <div className={styles.value}>{formatMoney(closingStats.cashSales)}</div>
                    </div>
                    <div className={styles.card}>
                        <h3>UPI/Other</h3>
                        <div className={styles.value}>{formatMoney(closingStats.upiSales)}</div>
                    </div>
                </div>
            </div>

            <div className={styles.row}>
                {/* GST Report */}
                <div className={styles.col}>
                    <h2>GST Summary (All Time)</h2>
                    <div className={styles.table}>
                        <div className={styles.tr}>
                            <span>Rate</span>
                            <span>Collected</span>
                        </div>
                        {Object.entries(gstStats.breakdown).map(([rate, amount]: any) => (
                            <div key={rate} className={styles.tr}>
                                <span>{rate}</span>
                                <span>{formatMoney(amount)}</span>
                            </div>
                        ))}
                        <div className={styles.tr} style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <span>Total</span>
                            <span>{formatMoney(gstStats.totalGST)}</span>
                        </div>
                    </div>
                </div>

                {/* Sales History Table */}
                <div className={styles.col} style={{ flex: 2 }}>
                    <h2>Last 30 Days</h2>
                    <div className={styles.table} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <div className={styles.tr}>
                            <span>Date</span>
                            <span>Orders</span>
                            <span>Sales</span>
                            <span>Profit</span>
                        </div>
                        {dailyStats.slice().reverse().map(stat => (
                            <div key={stat.date} className={styles.tr}>
                                <span>{stat.date}</span>
                                <span>{stat.totalOrders}</span>
                                <span>{formatMoney(stat.totalSales)}</span>
                                <span style={{ color: 'green' }}>{formatMoney(stat.totalProfit)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
