import Link from 'next/link'
import styles from './dashboard.module.css'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import NavLinks from './NavLinks'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    // Only owners can access the dashboard
    if (session.user.role !== 'OWNER') {
        redirect('/pos')
    }

    return (
        <div className={styles.layoutContainer}>
            {/* 1. Top Header */}
            <header className={styles.header}>
                <div className={styles.brandSection}>
                    <div className={styles.logo}>ShopLedger</div>
                    <span className={styles.badge}>Owner Mode</span>
                </div>
                <div className={styles.userSection}>
                    <span className={styles.userName}>{session.user.name}</span>
                    <form action="/api/auth/logout" method="POST">
                        {/* Simple Logout - in real app, use client component for cleaner handling */}
                        <button type="submit" className={styles.logoutBtn}>
                            <LogOut size={16} /> Logout
                        </button>
                    </form>
                </div>
            </header>

            {/* 2. Secondary Navigation */}
            <nav className={styles.navBar}>
                <NavLinks userRole={session.user.role} />
            </nav>

            {/* 3. Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    )
}
