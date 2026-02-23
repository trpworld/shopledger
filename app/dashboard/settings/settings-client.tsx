'use client'

import { useState } from 'react'
import { updateSettings, SettingsMap } from '@/app/actions/settings'
import { Save } from 'lucide-react'

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsMap }) {
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSaving(true)
        setMessage({ type: '', text: '' })

        const formData = new FormData(e.currentTarget)
        // Convert checkboxes to string values
        const autoPrint = formData.get('AUTO_PRINT') ? 'true' : 'false'
        formData.set('AUTO_PRINT', autoPrint)

        const resetDaily = formData.get('RESET_ORDER_DAILY') ? 'true' : 'false'
        formData.set('RESET_ORDER_DAILY', resetDaily)

        const autoDiscount = formData.get('AUTO_DISCOUNT_ENABLED') ? 'true' : 'false'
        formData.set('AUTO_DISCOUNT_ENABLED', autoDiscount)

        const res = await updateSettings(formData)

        if (res.error) {
            setMessage({ type: 'error', text: res.error })
        } else {
            setMessage({ type: 'success', text: 'Settings saved successfully!' })
            setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        }

        setIsSaving(false)
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>Shop Settings</h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Configure your POS and UPI payment details.</p>
            </div>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce3',
                    color: message.type === 'error' ? '#991b1b' : '#166534',
                    border: `1px solid ${message.type === 'error' ? '#f87171' : '#86efac'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                {/* Shop Information */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Shop Details</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>Shop Name</label>
                            <input name="SHOP_NAME" defaultValue={initialSettings.SHOP_NAME} required style={inputStyle} placeholder="e.g. Raj Retail Store" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>Mobile Number</label>
                            <input name="SHOP_MOBILE" defaultValue={initialSettings.SHOP_MOBILE} required style={inputStyle} placeholder="e.g. 9876543210" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>GST Number (Optional)</label>
                            <input name="GST_NUMBER" defaultValue={initialSettings.GST_NUMBER} style={inputStyle} placeholder="e.g. 29ABCDE1234FZ5" />
                        </div>
                    </div>
                </div>

                {/* Payment Configuration */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginTop: '1rem' }}>Payment Configuration</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>UPI ID (VPA)</label>
                            <input name="UPI_ID" defaultValue={initialSettings.UPI_ID} required style={inputStyle} placeholder="e.g. yourname@ybl" />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>This ID will be used to generate dynamic payment QRs.</span>
                        </div>
                    </div>
                </div>

                {/* Print Settings */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginTop: '1rem' }}>Printing</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="checkbox"
                            name="AUTO_PRINT"
                            id="autoPrint"
                            defaultChecked={initialSettings.AUTO_PRINT === 'true'}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoPrint" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', cursor: 'pointer' }}>
                            Auto-print bill after successful checkout
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <input
                            type="checkbox"
                            name="RESET_ORDER_DAILY"
                            id="resetDaily"
                            defaultChecked={initialSettings.RESET_ORDER_DAILY === 'true'}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="resetDaily" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', cursor: 'pointer' }}>
                            Reset Order Numbers Daily (e.g. starts from 1 every morning)
                        </label>
                    </div>
                </div>

                {/* Auto Discount */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginTop: '1rem' }}>Automatic Discounts</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <input
                            type="checkbox"
                            name="AUTO_DISCOUNT_ENABLED"
                            id="autoDiscountEnabled"
                            defaultChecked={initialSettings.AUTO_DISCOUNT_ENABLED === 'true'}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoDiscountEnabled" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', cursor: 'pointer' }}>
                            Enable Automatic Cart Discount
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>Threshold Amount (₹)</label>
                            <input type="number" name="AUTO_DISCOUNT_THRESHOLD" defaultValue={initialSettings.AUTO_DISCOUNT_THRESHOLD} required style={inputStyle} placeholder="5000" min="0" step="0.01" />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Apply discount if subtotal is greater or equal to this.</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4b5563' }}>Discount Percentage (%)</label>
                            <input type="number" name="AUTO_DISCOUNT_PERCENTAGE" defaultValue={initialSettings.AUTO_DISCOUNT_PERCENTAGE} required style={inputStyle} placeholder="2" min="0" max="100" step="0.01" />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Deduct this % off the subtotal.</span>
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />

                {/* Data Backup & Restore */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Data Backup & Restore</h2>
                    <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
                        PostgreSQL databases cannot be downloaded directly like SQLite. Use the button below to download a full JSON backup of all Orders, Customers, and Products.
                        <strong>We recommend downloading a backup every week.</strong>
                    </p>
                    <a
                        href="/api/backup"
                        download
                        style={{
                            display: 'inline-block',
                            padding: '10px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}
                    >
                        Export Full Database Backup (JSON)
                    </a>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />

                <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px', background: '#2563eb', color: 'white', border: 'none',
                        borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.7 : 1, transition: 'background 0.2s'
                    }}
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>

            </form >
        </div >
    )
}

const inputStyle = {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
}
