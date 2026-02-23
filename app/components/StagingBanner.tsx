'use client'

import { useEffect, useState } from 'react'

export default function StagingBanner() {
    const [isStaging, setIsStaging] = useState(false)

    useEffect(() => {
        // Safe check on client only
        if (process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
            setIsStaging(true)
        }
    }, [])

    if (!isStaging) return null

    return (
        <div style={{
            background: '#eab308',
            color: 'black',
            textAlign: 'center',
            fontWeight: 'bold',
            padding: '0.5rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999
        }}>
            ⚠ STAGING MODE - DATA WILL NOT BE SAVED
        </div>
    )
}
