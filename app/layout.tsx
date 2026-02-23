import type { Metadata, Viewport } from 'next'
import './globals.css'
import StagingBanner from './components/StagingBanner'

export const metadata: Metadata = {
    title: 'ShopLedger – Retail POS System',
    description: 'Point of Sale System',
    manifest: '/manifest.json',
}

export const viewport: Viewport = {
    themeColor: '#2563eb',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <StagingBanner />
                <div style={{ marginTop: '0px' }}>
                    {children}
                </div>
            </body>
        </html>
    )
}
