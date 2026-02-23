'use client'

import { useState } from 'react'
import { createOffer, updateOffer, toggleOfferActive, getOptedInCustomerPhones } from '@/app/actions/offer-admin'
import { Plus, Download, Copy, Loader2, CheckCircle2, Ticket, MessageCircle } from 'lucide-react'

type Offer = {
    id: string
    title: string
    code: string
    message: string
    discountPercentage: number
    validTill: Date
    isActive: boolean
    createdAt: Date
}

export default function OffersClient({ initialOffers }: { initialOffers: Offer[] }) {
    const [offers, setOffers] = useState<Offer[]>(initialOffers)
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
    const [isCreating, setIsCreating] = useState(false)
    const [editMode, setEditMode] = useState<string | null>(null)
    const [exportLoading, setExportLoading] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [code, setCode] = useState('')
    const [message, setMessage] = useState('')
    const [discountPercentage, setDiscountPercentage] = useState<number | ''>('')
    const [validTill, setValidTill] = useState('')

    const activeOffer = offers.find(o => o.isActive)

    const resetForm = () => {
        setTitle('')
        setCode('')
        setMessage('')
        setDiscountPercentage('')
        setValidTill('')
        setIsCreating(false)
        setEditMode(null)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingMap(p => ({ ...p, form: true }))
        const res = await createOffer({
            title,
            code,
            message,
            discountPercentage: Number(discountPercentage) || 0,
            validTill: new Date(validTill)
        })
        if (res.success && res.offer) {
            setOffers(prev => [res.offer, ...prev])
            resetForm()
        } else {
            alert(res.error)
        }
        setLoadingMap(p => ({ ...p, form: false }))
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editMode) return
        setLoadingMap(p => ({ ...p, form: true }))
        const res = await updateOffer(editMode, {
            title,
            code,
            message,
            discountPercentage: Number(discountPercentage) || 0,
            validTill: new Date(validTill)
        })
        if (res.success && res.offer) {
            setOffers(prev => prev.map(o => o.id === editMode ? res.offer : o))
            resetForm()
        } else {
            alert(res.error)
        }
        setLoadingMap(p => ({ ...p, form: false }))
    }

    const openEdit = (offer: Offer) => {
        setTitle(offer.title)
        setCode(offer.code || '')
        setMessage(offer.message)
        setDiscountPercentage(offer.discountPercentage || '')
        setValidTill(new Date(offer.validTill).toISOString().slice(0, 16)) // YYYY-MM-DDThh:mm format for datetime-local
        setEditMode(offer.id)
        setIsCreating(true)
    }

    const handleToggleActive = async (id: string, currentlyActive: boolean) => {
        setLoadingMap(p => ({ ...p, [id]: true }))
        const res = await toggleOfferActive(id, !currentlyActive)
        if (res.success) {
            setOffers(prev => prev.map(o => {
                if (o.id === id) return { ...o, isActive: !currentlyActive }
                // Only one can be active at a time (as per server action)
                if (!currentlyActive && o.isActive) return { ...o, isActive: false }
                return o
            }))
        } else {
            alert(res.error)
        }
        setLoadingMap(p => ({ ...p, [id]: false }))
    }

    const handleExport = async () => {
        if (!activeOffer) {
            alert('Please activate an offer first to generate a broadcast list.')
            return
        }
        setExportLoading(true)
        try {
            const customers = await getOptedInCustomerPhones()
            if (customers.length === 0) {
                alert('No opted-in customers found.')
                return
            }

            // CSV Gen
            const csvRows = ['Name,Phone']
            customers.forEach((c: { name: string | null, phone: string }) => {
                csvRows.push(`${c.name || 'Customer'},${c.phone}`)
            })
            const csvString = csvRows.join('\n')
            const blob = new Blob([csvString], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.setAttribute('hidden', '')
            a.setAttribute('href', url)
            a.setAttribute('download', `ShopLedger_Broadcast_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (e: any) {
            alert('Failed to export list: ' + e.message)
        }
        setExportLoading(false)
    }

    const copyToClipboard = () => {
        if (!activeOffer) return
        navigator.clipboard.writeText(activeOffer.message)
        alert('Copied to clipboard!')
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Ticket color="#2563eb" size={28} /> Promos & Offers
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Create offers that print on receipts and broadcast them via WhatsApp.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111827', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        <Plus size={18} /> New Offer
                    </button>
                )}
            </div>

            {/* FORM AREA */}
            {isCreating && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                        {editMode ? 'Edit Offer' : 'Create New Offer'}
                    </h2>
                    <form onSubmit={editMode ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Offer Title (Prints on Bill)</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. 10% OFF on Next Visit"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Promo Code (For POS)</label>
                                <input
                                    type="text"
                                    required
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. FLAT10"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', textTransform: 'uppercase' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Discount %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    required
                                    value={discountPercentage}
                                    onChange={e => setDiscountPercentage(Number(e.target.value))}
                                    placeholder="e.g. 10"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Valid Till</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={validTill}
                                    onChange={e => setValidTill(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>WhatsApp Broadcast Message</label>
                            <textarea
                                required
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Write the message you will copy-paste to your WhatsApp broadcast..."
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" disabled={loadingMap.form} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {loadingMap.form && <Loader2 size={16} className="animate-spin" />} Save Offer
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BROADCAST TOOL (PHASE 5) */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <MessageCircle size={20} color="#10b981" /> WhatsApp Broadcast Tool (FREE)
                </h2>
                {activeOffer ? (
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
                        <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                            {activeOffer.message}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '250px' }}>
                            <button onClick={copyToClipboard} style={{ padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Copy size={16} /> Copy Message
                            </button>
                            <button onClick={handleExport} disabled={exportLoading} style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download Numbers (CSV)
                            </button>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                                Instruction: Add numbers to WhatsApp Broadcast List and paste this message manually.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#64748b', fontSize: '0.95rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        No Active Offer. Activate an offer below to use the Broadcast Tool.
                    </div>
                )}
            </div>

            {/* OFFERS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>All Offers</h2>
                {offers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        No offers created yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {offers.map(offer => {
                            const isExpired = new Date(offer.validTill) < new Date()

                            return (
                                <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.25rem', borderRadius: '12px', border: `2px solid ${offer.isActive ? '#2563eb' : '#e5e7eb'}`, position: 'relative' }}>
                                    {offer.isActive && (
                                        <div style={{ position: 'absolute', top: '-10px', right: '20px', background: '#2563eb', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>
                                            ACTIVE NOW
                                        </div>
                                    )}

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{offer.title}</h3>
                                            <span style={{ fontSize: '0.8rem', background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px dashed #a5b4fc', letterSpacing: '1px' }}>{offer.code}</span>
                                            {offer.discountPercentage > 0 && (
                                                <span style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{offer.discountPercentage}% OFF</span>
                                            )}
                                            {isExpired && !offer.isActive && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Expired</span>}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '8px', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            "{offer.message}"
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                            Valid till: {new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <button
                                            onClick={() => openEdit(offer)}
                                            style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '6px 16px', borderRadius: '6px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(offer.id, offer.isActive)}
                                            disabled={loadingMap[offer.id] || (isExpired && !offer.isActive)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: (isExpired && !offer.isActive) ? 'not-allowed' : 'pointer',
                                                background: offer.isActive ? '#fef2f2' : '#ecfdf5',
                                                color: offer.isActive ? '#dc2626' : '#059669',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                minWidth: '110px',
                                                justifyContent: 'center',
                                                opacity: (isExpired && !offer.isActive) ? 0.5 : 1
                                            }}
                                        >
                                            {loadingMap[offer.id] ? <Loader2 size={16} className="animate-spin" /> :
                                                offer.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
