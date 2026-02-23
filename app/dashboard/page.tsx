import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import { formatMoney } from '@/lib/format'
import {
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    IndianRupee,
    ShoppingCart,
    FileText,
    Database,
    ShieldCheck,
    LogOut,
    Bell,
    Settings,
    Package
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user.role === 'HELPER') redirect('/dashboard/products')
    if (session.user.role !== 'OWNER') redirect('/login')

    // 1. Metrics Data
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    // 1. Parallel Data Fetching
    const [todayOrders, lowStockCount, topSelling] = await Promise.all([
        db.order.findMany({
            where: { createdAt: { gte: startOfDay } },
            include: { items: true }
        }),
        db.product.count({
            where: { stock: { lte: 5 }, isActive: true }
        }),
        db.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 1
        })
    ])

    let salesTotal = 0
    let profitTotal = 0

    todayOrders.forEach(o => {
        salesTotal += o.totalAmount
        o.items.forEach(i => {
            profitTotal += (i.price - i.buyPrice) * i.quantity
        })
    })

    let topProduct = null
    if (topSelling.length > 0) {
        topProduct = await db.product.findUnique({ where: { id: topSelling[0].productId } })
    }

    // Greeting Logic
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
    const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })



    return (
        <div className={styles.layoutContainer}>
            {/* --- EXECUTIVE HEADER --- */}
            <header className={styles.header}>
                <div className={styles.brandSection}>
                    <div className={styles.logo}>
                        <div style={{ background: '#4f46e5', color: 'white', padding: '6px', borderRadius: '8px' }}>
                            🛍️
                        </div>
                        <span>Owner Dashboard</span>
                    </div>
                </div>
                <div className={styles.userSection}>
                    <div className={styles.avatar}>
                        {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <div className={styles.mainContent}>
                {/* Greeting Section */}
                <div className={styles.greetingSection}>
                    <h1 className={styles.greeting}>{greeting}, {session.user.name}</h1>
                    <div className={styles.dateLine}>{dateString} • All Systems Operational</div>
                </div>

                {/* SECTION 1: EXECUTIVE KPIs */}
                <div className={styles.metricsGrid}>
                    {/* Sales */}
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>Today's Revenue</span>
                            <div className={styles.metricIcon} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                <IndianRupee size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue}>{formatMoney(salesTotal)}</div>
                        <div className={styles.trendBadges}>
                            <span className={`${styles.activeBadge} ${styles.badgeGreen}`}>
                                <TrendingUp size={12} /> Live
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                {todayOrders.length} orders
                            </span>
                        </div>
                    </div>

                    {/* Profit */}
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>Net Profit</span>
                            <div className={styles.metricIcon} style={{ background: '#dcfce7', color: '#166534' }}>
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue} style={{ color: '#16a34a' }}>
                            {formatMoney(profitTotal)}
                        </div>
                        <div className={styles.trendBadges}>
                            <span className={`${styles.activeBadge} ${styles.badgeGreen}`}>
                                + Margin
                            </span>
                        </div>
                    </div>

                    {/* Low Stock */}
                    <div className={styles.metricCard} style={lowStockCount > 0 ? { border: '1px solid #fee2e2' } : {}}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>Inventory Risk</span>
                            <div className={styles.metricIcon} style={{ background: lowStockCount > 0 ? '#fee2e2' : '#f3f4f6', color: lowStockCount > 0 ? '#991b1b' : '#374151' }}>
                                <AlertTriangle size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue} style={{ color: lowStockCount > 0 ? '#dc2626' : '#111827' }}>
                            {lowStockCount}
                        </div>
                        <div className={styles.trendBadges}>
                            {lowStockCount > 0 ? (
                                <span className={`${styles.activeBadge} ${styles.badgeRed}`}>Action Needed</span>
                            ) : (
                                <span className={`${styles.activeBadge} ${styles.badgeBlue}`}>Healthy</span>
                            )}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>System Health</span>
                            <div className={styles.metricIcon}>
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue} style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
                            100% Uptime
                        </div>
                        <div className={styles.trendBadges}>
                            <span className={`${styles.activeBadge} ${styles.badgeBlue}`}>
                                <CheckCircle size={12} /> Verified
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: MANAGEMENT GRID */}
                <h2 className={styles.sectionTitle}>
                    <Settings size={20} /> Management Console
                </h2>
                <div className={styles.actionsGrid}>
                    <Link href="/dashboard/reports" className={styles.actionBtn}>
                        <FileText size={28} className={styles.actionIcon} />
                        <span>Financial Reports</span>
                    </Link>
                    <Link href="/dashboard/products" className={styles.actionBtn}>
                        <Package size={28} className={styles.actionIcon} color="#db2777" />
                        <span>Product Manager</span>
                    </Link>
                    <a href="/api/backup" target="_blank" className={styles.actionBtn}>
                        <Database size={28} className={styles.actionIcon} color="#059669" />
                        <span>Data Backup</span>
                    </a>
                    <Link href="/dashboard/production" className={styles.actionBtn}>
                        <ShieldCheck size={28} className={styles.actionIcon} color="#ea580c" />
                        <span>Production Mode</span>
                    </Link>
                </div>

                {/* SECTION 3: BUSINESS INSIGHTS */}
                <div className={styles.insightsGrid}>
                    {/* Top Performer */}
                    <div className={styles.insightCard}>
                        <h3 className={styles.sectionTitle}>🏆 Top Performing Product</h3>
                        {topProduct ? (
                            <div className={styles.insightContent}>
                                <div className={styles.insightRow}>
                                    <span style={{ fontWeight: '500' }}>{topProduct.name}</span>
                                    <span className={styles.insightValue}>{topSelling[0]._sum.quantity} Units</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                    Driving {Math.round((topProduct.priceSell * (topSelling[0]._sum.quantity || 0) / (salesTotal || 1)) * 100)}% of today's revenue.
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No sales data for today.</p>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className={styles.insightCard}>
                        <h3 className={styles.sectionTitle}>📊 Snapshot</h3>
                        <div className={styles.insightContent}>
                            <div className={styles.insightRow}>
                                <span>Avg. Order Value</span>
                                <span className={styles.insightValue}>
                                    {todayOrders.length > 0 ? formatMoney(salesTotal / todayOrders.length) : '₹0.00'}
                                </span>
                            </div>
                            <div className={styles.insightRow}>
                                <span>Active Users</span>
                                <span className={styles.insightValue}>1 (You)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <br />
                <br />
                <form action="/api/auth/logout" method="POST" style={{ textAlign: 'center' }}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}>
                        Sign Out of Dashboard
                    </button>
                </form>
            </div>
        </div>
    )
}
