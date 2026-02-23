'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// We dynamically import QRCode because it requires window/document objects which are undefined in SSR
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeCanvas), { ssr: false })

type UPIQRModalProps = {
    amount: number
    invoiceNumber: string
    shopName: string
    upiId: string
    onConfirm: () => void
    onCancel: () => void
}

export default function UPIQRModal({ amount, invoiceNumber, shopName, upiId, onConfirm, onCancel }: UPIQRModalProps) {
    const [timeLeft, setTimeLeft] = useState(60)

    // Countdown Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) {
            onCancel() // Auto cancel if they take too long
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, onCancel])

    // Generate dynamic UPI string
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Invoice-${invoiceNumber}`)}`

    // Wait until mounted to prevent hydration errors for SVG/Canvas sizing
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>

                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>UPI Payment</h2>
                    <button onClick={onCancel} style={iconBtnStyle}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{shopName}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', margin: '0.5rem 0' }}>
                            ₹{amount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Invoice No: {invoiceNumber}</div>
                    </div>

                    {/* QR Code */}
                    <div style={qrContainerStyle}>
                        {mounted && (
                            <QRCode
                                value={upiString}
                                size={200}
                                level={"H"}
                                includeMargin={true}
                                fgColor={"#000000"}
                                bgColor={"#ffffff"}
                            />
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Scan & Pay using any UPI app</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" height="24" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/Google_Pay_Logo_%282020%29.svg" alt="GPay" height="24" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" height="24" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png" alt="Paytm" height="24" />
                        </div>
                    </div>
                </div>

                {/* Footer / Confirmation Button */}
                <div style={footerStyle}>
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600, marginBottom: '1rem' }}>
                        Time remaining: {timeLeft}s
                    </div>

                    <button onClick={onConfirm} style={confirmBtnStyle}>
                        <CheckCircle2 size={20} />
                        CONFIRM PAYMENT RECEIVED
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                        Do NOT press confirm until payment is successful.
                    </p>
                </div>

            </div>
        </div>
    )
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    padding: '1rem'
}

const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column'
}

const headerStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb'
}

const iconBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', display: 'flex'
}

const contentStyle: React.CSSProperties = {
    padding: '2rem 1.5rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center'
}

const qrContainerStyle: React.CSSProperties = {
    padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
}

const footerStyle: React.CSSProperties = {
    padding: '1.5rem', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb'
}

const confirmBtnStyle: React.CSSProperties = {
    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '1rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px',
    fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
    transition: 'background-color 0.2s'
}
