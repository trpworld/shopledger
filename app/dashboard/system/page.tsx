import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import styles from '../dashboard.module.css'
import { Database, ShieldCheck, Server, AlertOctagon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SystemPage() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') redirect('/login')

    return (
        <div className={styles.layoutContainer}>
            <div className={styles.mainContent}>
                <div className={styles.greetingSection}>
                    <h1 className={styles.greeting}>System Status</h1>
                    <div className={styles.dateLine}>Backup & Maintenance Console</div>
                </div>

                <div className={styles.metricsGrid}>
                    {/* Database Status */}
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>Database Info</span>
                            <div className={styles.metricIcon} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                <Database size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue} style={{ fontSize: '1.2rem' }}>Connected</div>
                        <div className={styles.trendBadges}>
                            <span className={`${styles.activeBadge} ${styles.badgeGreen}`}>
                                Live
                            </span>
                        </div>
                    </div>

                    {/* Server Status */}
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <span className={styles.metricLabel}>Server</span>
                            <div className={styles.metricIcon} style={{ background: '#dbeafe', color: '#1e40af' }}>
                                <Server size={18} />
                            </div>
                        </div>
                        <div className={styles.metricValue} style={{ fontSize: '1.2rem' }}>Vercel / Node</div>
                        <div className={styles.trendBadges}>
                            <span className={`${styles.activeBadge} ${styles.badgeBlue}`}>
                                US-East
                            </span>
                        </div>
                    </div>
                </div>

                <h2 className={styles.sectionTitle}>Maintenance Actions</h2>
                <div className={styles.actionsGrid}>
                    <a href="/api/backup" target="_blank" className={styles.actionBtn}>
                        <Database size={28} className={styles.actionIcon} color="#059669" />
                        <span>Download Backup</span>
                    </a>
                    <div className={styles.actionBtn}>
                        <AlertOctagon size={28} className={styles.actionIcon} color="#ef4444" />
                        <span>Reset Cache</span>
                    </div>
                </div>

                <h2 className={styles.sectionTitle}>Production Mode</h2>
                <div className={styles.insightCard}>
                    <div className={styles.insightContent}>
                        <div className={styles.insightRow}>
                            <span>Environment</span>
                            <span className={styles.insightValue}>Production (v2.4.0)</span>
                        </div>
                        <div className={styles.insightRow}>
                            <span>Debug Mode</span>
                            <span className={styles.insightValue}>OFF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
