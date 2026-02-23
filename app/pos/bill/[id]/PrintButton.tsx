'use client'

import { useEffect } from 'react'

interface PrintButtonProps {
    className?: string
    autoPrint?: boolean
}

export default function PrintButton({ className, autoPrint = false }: PrintButtonProps) {
    useEffect(() => {
        if (autoPrint) {
            // Give the browser a tiny moment to render the DOM then print
            const timer = setTimeout(() => {
                window.print()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [autoPrint])

    return (
        <button
            className={className}
            type="button"
            onClick={() => window.print()}
        >
            Print Bill
        </button>
    )
}
