'use client'

import { loginAction } from '@/app/actions/auth'
import styles from './login.module.css'
import { User, Lock } from 'lucide-react'

export default function LoginPage() {
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const result = await loginAction(formData)
        if (result && result.error) {
            alert(result.error) // Simple alert for MVP speed, better UI later
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoIcon}>🛍️</div>
                    <h1 className={styles.title}>Welcome to ShopLedger</h1>
                    <p className={styles.subtitle}>Smart billing & inventory management</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Username</label>
                        <div className={styles.inputWrapper}>
                            <User className={styles.inputIcon} size={20} />
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className={styles.input}
                                placeholder="e.g. Owner, Cashier"
                            />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} size={20} />
                            <input
                                type="password"
                                name="password"
                                id="password"
                                required
                                className={styles.input}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button type="submit" className={styles.button}>Secure Login</button>
                </form>
            </div>
        </div>
    )
}
