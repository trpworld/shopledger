'use client'

import { useState } from 'react'
import { toggleCustomerOffers, deleteCustomer } from '@/app/actions/customer-admin'
import { Search, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Customer = {
    id: string
    phone: string
    name: string | null
    visitCount: number
    totalSpent: number
    lastVisit: Date
    allowOffers: boolean
    createdAt: Date
}

export default function CustomerClient({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [search, setSearch] = useState('')
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
    const router = useRouter()

    const filtered = customers.filter(c =>
        c.phone.includes(search) ||
        (c.name && c.name.toLowerCase().includes(search.toLowerCase()))
    )

    const handleToggleOffers = async (id: string, current: boolean) => {
        setLoadingMap(p => ({ ...p, [id]: true }))
        const res = await toggleCustomerOffers(id, !current)
        if (res.success) {
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, allowOffers: !current } : c))
        } else {
            alert(res.error || 'Failed to toggle')
        }
        setLoadingMap(p => ({ ...p, [id]: false }))
    }

    const handleDelete = async (id: string, phone: string) => {
        if (!confirm(`Are you sure you want to delete customer ${phone}? Orders will be kept but unlinked.`)) return

        setLoadingMap(p => ({ ...p, [id]: true }))
        const res = await deleteCustomer(id)
        if (res.success) {
            setCustomers(prev => prev.filter(c => c.id !== id))
        } else {
            alert(res.error || 'Failed to delete')
            setLoadingMap(p => ({ ...p, [id]: false }))
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Customer Database</h1>
                    <p style={{ color: '#6b7280' }}>Manage returning customers and their WhatsApp offer preferences.</p>
                </div>
                <div style={{ padding: '0.75rem 1.5rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', fontWeight: 'bold' }}>
                    Total: {customers.length}
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    type="text"
                    placeholder="Search by phone or name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                />
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.85rem', textTransform: 'uppercase', color: '#6b7280' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>Customer Info</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>Engagement</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>Last Visit</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>WhatsApp Opt-in</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.95rem' }}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No customers found.</td></tr>
                        ) : filtered.map(customer => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>{customer.phone}</div>
                                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{customer.name || 'No Name'}</div>
                                    {customer.visitCount >= 5 && (
                                        <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>LOYAL</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div><span style={{ color: '#6b7280' }}>Visits:</span> <strong style={{ color: '#2563eb' }}>{customer.visitCount}</strong></div>
                                    <div><span style={{ color: '#6b7280' }}>Total Spent:</span> <strong>₹{customer.totalSpent.toFixed(2)}</strong></div>
                                </td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>
                                    {new Date(customer.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleToggleOffers(customer.id, customer.allowOffers)}
                                        disabled={loadingMap[customer.id]}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            cursor: loadingMap[customer.id] ? 'wait' : 'pointer',
                                            background: customer.allowOffers ? '#ecfdf5' : '#fef2f2',
                                            color: customer.allowOffers ? '#059669' : '#dc2626',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {loadingMap[customer.id] ? <Loader2 size={16} className="animate-spin" /> :
                                            customer.allowOffers ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        {customer.allowOffers ? 'Opted In' : 'Opted Out'}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleDelete(customer.id, customer.phone)}
                                        disabled={loadingMap[customer.id]}
                                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}
                                        title="Delete Customer"
                                    >
                                        {loadingMap[customer.id] ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="hover:text-red-500 transition-colors" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
