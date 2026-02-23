import { getDailySalesStats, getGSTSummary, getClosingSummary, getTopProducts, getDetailedexportData } from '@/lib/analytics'
import ReportsClient from './reports-client'

export default async function ReportsPage() {
    const rawDailyStats = await getDailySalesStats()
    const rawGstStats = await getGSTSummary()
    const rawClosingStats = await getClosingSummary()
    const rawTopProducts = await getTopProducts()
    const rawDetailedExport = await getDetailedexportData()

    // STRICT SANITIZATION: Ensure only plain objects/primitives are passed to Client Component
    // Prisma Decimals -> Numbers, Dates -> Strings
    const dailyStats = rawDailyStats.map(d => ({
        ...d,
        totalSales: Number(d.totalSales),
        totalProfit: Number(d.totalProfit)
    }))

    const gstStats = {
        totalGST: Number(rawGstStats.totalGST),
        breakdown: Object.fromEntries(
            Object.entries(rawGstStats.breakdown).map(([k, v]) => [k, Number(v)])
        )
    }

    const closingStats = {
        totalSales: Number(rawClosingStats.totalSales),
        cashSales: Number(rawClosingStats.cashSales),
        upiSales: Number(rawClosingStats.upiSales),
        totalProfit: Number(rawClosingStats.totalProfit)
    }

    const topProducts = rawTopProducts.map(p => ({
        name: String(p.name),
        qty: Number(p.qty)
    }))

    const detailedExport = rawDetailedExport.map(d => ({
        ...d,
        sellPrice: Number(d.sellPrice),
        buyPrice: Number(d.buyPrice),
        gstRate: Number(d.gstRate),
        gstAmount: Number(d.gstAmount),
        total: Number(d.total),
        profit: Number(d.profit)
    }))

    return (
        <ReportsClient
            dailyStats={dailyStats}
            gstStats={gstStats}
            closingStats={closingStats}
            topProducts={topProducts}
            detailedExport={detailedExport}
        />
    )
}
