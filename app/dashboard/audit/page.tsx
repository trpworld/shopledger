import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import styles from '../dashboard.module.css'
import { FileText, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') redirect('/login')

    return (
        <div className={styles.layoutContainer}>
            <div className={styles.mainContent}>
                <div className={styles.greetingSection}>
                    <h1 className={styles.greeting}>Audit Logs</h1>
                    <div className={styles.dateLine}>Track System Events & transactions</div>
                </div>

                <div className={styles.insightCard}>
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No critical security events detected in the last 24 hours.</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Detailed logging is enabled.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
