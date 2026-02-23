'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './dashboard.module.css'
import { LayoutDashboard, Package, FileText, Activity, ShieldCheck, Settings, Users, Gift } from 'lucide-react'

export default function NavLinks({ userRole }: { userRole?: string }) {
    const pathname = usePathname()

    const allLinks = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/dashboard/products', icon: Package },
        { name: 'Customers', href: '/dashboard/customers', icon: Users },
        { name: 'Offers', href: '/dashboard/offers', icon: Gift },
        { name: 'Reports', href: '/dashboard/reports', icon: FileText },
        { name: 'Audit', href: '/dashboard/audit', icon: Activity },
        { name: 'System', href: '/dashboard/production', icon: ShieldCheck },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]

    // HELPER role only sees the Products route
    const links = userRole === 'HELPER'
        ? allLinks.filter(link => link.name === 'Products')
        : allLinks // OWNER sees all

    return (
        <div className={styles.navContainer}>
            {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    >
                        <Icon size={18} />
                        <span>{link.name}</span>
                    </Link>
                )
            })}
        </div>
    )
}
