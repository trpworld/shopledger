'use client'

import { useState } from 'react'
import { runSystemDiagnostics, type HealthStatus } from '@/app/actions/health'
import styles from './audit.module.css'

export default function AuditPage() {
    const [status, setStatus] = useState<HealthStatus | null>(null)
    const [loading, setLoading] = useState(false)

    async function runCheck() {
        setLoading(true)
        try {
            const result = await runSystemDiagnostics()
            setStatus(result)
        } catch (e) {
            alert('Failed to run diagnostics')
        }
        setLoading(false)
    }

    return (
        <div className={styles.container}>
            <h1>System Audit & Health</h1>

            <div className={styles.section}>
                <h2>Diagnostics</h2>
                <button onClick={runCheck} disabled={loading} className={styles.checkBtn}>
                    {loading ? 'Running...' : 'Run System Health Check'}
                </button>

                {status && (
                    <div className={styles.results}>
                        <div className={styles.item}>
                            <span>Database Integrity:</span>
                            <span className={status.dbIntegrity ? styles.pass : styles.fail}>
                                {status.dbIntegrity ? 'PASSED' : 'FAILED'}
                            </span>
                        </div>
                        <div className={styles.item}>
                            <span>Financial Reconciliation:</span>
                            <span className={status.financialDiscrepancies === 0 ? styles.pass : styles.fail}>
                                {status.financialDiscrepancies === 0 ? 'PERFECT' : `${status.financialDiscrepancies} Errors Found`}
                            </span>
                        </div>
                        <div className={styles.item}>
                            <span>Negative Profits:</span>
                            <span className={status.negativeProfits === 0 ? styles.pass : styles.warn}>
                                {status.negativeProfits === 0 ? 'None' : `${status.negativeProfits} Orders`}
                            </span>
                        </div>
                        <div className={styles.item}>
                            <span>Legacy/Missing Data:</span>
                            <span className={status.missingSnapshots === 0 ? styles.pass : styles.warn}>
                                {status.missingSnapshots === 0 ? 'None' : `${status.missingSnapshots} Items`}
                            </span>
                        </div>
                        <div className={styles.item}>
                            <span>Stock warning (Negative):</span>
                            <span className={status.stockDiscrepancies === 0 ? styles.pass : styles.warn}>
                                {status.stockDiscrepancies} Products
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h2>Data Backup</h2>
                <p>Download a copy of your database safely.</p>
                <a href="/api/backup" target="_blank" className={styles.backupBtn}>
                    Download Database Backup (.db)
                </a>
            </div>
        </div>
    )
}
