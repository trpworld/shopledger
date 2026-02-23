'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createOrder } from '@/app/actions/pos'
import { findOrCreateCustomer } from '@/app/actions/customers'
import { validatePromoCode } from '@/app/actions/offer-admin'
import styles from './pos.module.css'
import { useRouter } from 'next/navigation'
import { LogOut, Search, ScanLine, X, Minus, Plus, ShoppingCart } from 'lucide-react'
import dynamic from 'next/dynamic'
import UPIQRModal from './UPIQRModal'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })



type Product = {
    id: string
    name: string
    barcode: string
    priceSell: number
    stock: number
    gstRate: number
    image?: string | null
}

type CartItem = Product & {
    qty: number
}

export default function POSClient({ initialProducts, userRole, shopSettings }: { initialProducts: Product[], userRole: string, shopSettings: { name: string, upiId: string, autoDiscountEnabled?: boolean, autoDiscountThreshold?: number, autoDiscountPercentage?: number } }) {
    const [products] = useState<Product[]>(initialProducts)
    const [cart, setCart] = useState<CartItem[]>([])

    // --- Scan State ---
    const [search, setSearch] = useState('')
    const [scanResult, setScanResult] = useState<Product | null>(null)
    const [scanQty, setScanQty] = useState(1)
    const [instantAdd, setInstantAdd] = useState(false) // Toggle State

    // --- Customer State ---
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [activeCustomer, setActiveCustomer] = useState<any>(null)
    const [isSavingCustomer, setIsSavingCustomer] = useState(false)

    // --- Promo Logic ---
    const [promoCodeInput, setPromoCodeInput] = useState('')
    const [appliedPromo, setAppliedPromo] = useState<{ code: string, percentage: number, title: string } | null>(null)
    const [isValidatingPromo, setIsValidatingPromo] = useState(false)

    const [mounted, setMounted] = useState(false)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [showUPIModal, setShowUPIModal] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => { setMounted(true) }, [])

    // --- Cart Logic ---
    const addToCart = useCallback((product: Product, qty: number = 1) => {
        if (product.stock <= 0) {
            alert('Out of Stock!')
            return
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                if (existing.qty + qty > product.stock) {
                    alert(`Limit reached! Only ${product.stock} in stock.`)
                    return prev
                }
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item)
            }
            if (qty > product.stock) {
                alert(`Limit reached! Only ${product.stock} in stock.`)
                return prev
            }
            return [...prev, { ...product, qty }]
        })
    }, [])

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const updateQty = (id: string, newQty: number) => {
        if (newQty < 1) return
        const product = products.find(p => p.id === id)
        if (product && newQty > product.stock) {
            alert(`Only ${product.stock} units available.`)
            return
        }
        setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item))
    }

    const clearCart = () => {
        if (confirm('Clear entire bill?')) {
            setCart([])
            setAppliedPromo(null)
            setPromoCodeInput('')
        }
    }

    // --- Scan Logic ---
    const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const query = search.trim()
            if (!query) return

            // 1. Find Product (Exact Barcode first, then Name)
            const product = products.find(p => p.barcode === query) ||
                products.find(p => p.name && p.name.toLowerCase() === query.toLowerCase())

            if (product) {
                if (instantAdd) {
                    // Fast Mode: Add 1 & Clear
                    addToCart(product, 1)
                    setSearch('')
                    showToast(`Added ${product.name}`)
                } else {
                    // Confirmation Mode: Show Result Card
                    setScanResult(product)
                    setScanQty(1)
                    setSearch('') // Clear input but show result
                }
            } else {
                alert('Product not found!')
                setSearch('')
            }
        }
    }

    const confirmScanAdd = () => {
        if (scanResult) {
            addToCart(scanResult, scanQty)
            setScanResult(null) // Return to scan mode
            // Refocus after short delay to let UI settle
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }

    const cancelScan = () => {
        setScanResult(null)
        setTimeout(() => searchInputRef.current?.focus(), 100)
    }

    const showToast = (msg: string) => {
        // Simple placeholder for toast
        // In real app use a library or custom component
        console.log("Toast:", msg)
    }

    // --- Focus Management ---
    useEffect(() => {
        const focusInput = () => {
            // Only focus if not editing qty in result card or cart, and not customer inputs
            if (!scanResult && document.activeElement?.tagName !== 'INPUT') {
                searchInputRef.current?.focus()
            }
        }
        focusInput()
        window.addEventListener('click', focusInput)
        return () => window.removeEventListener('click', focusInput)
    }, [scanResult, cart])

    // --- Customer Logic ---
    const handleSaveCustomer = async () => {
        if (!customerPhone || customerPhone.length !== 10) {
            alert('Please enter a valid 10-digit phone number.')
            return
        }
        setIsSavingCustomer(true)
        try {
            const res = await findOrCreateCustomer(customerPhone, customerName)
            if (res.error) {
                alert(res.error)
            } else if (res.success && res.customer) {
                setActiveCustomer(res.customer)
                showToast(`Customer added`)
            }
        } catch (err) {
            console.error(err)
            alert('Failed to save customer.')
        } finally {
            setIsSavingCustomer(false)
        }
    }

    const clearCustomer = () => {
        setActiveCustomer(null)
        setCustomerPhone('')
        setCustomerName('')
        setAppliedPromo(null)
        setPromoCodeInput('')
    }

    // --- Promo Handler ---
    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return
        setIsValidatingPromo(true)
        const res = await validatePromoCode(promoCodeInput.trim())
        if (res.success && res.discountPercentage !== undefined && res.title) {
            setAppliedPromo({ code: promoCodeInput.trim().toUpperCase(), percentage: res.discountPercentage, title: res.title })
            showToast(`Promo Applied: ${res.discountPercentage}% OFF`)
        } else {
            alert(res.error || 'Invalid promo code')
            setAppliedPromo(null)
        }
        setIsValidatingPromo(false)
    }

    const clearPromo = () => {
        setAppliedPromo(null)
        setPromoCodeInput('')
    }

    // --- Checkouting ---
    const subtotal = cart.reduce((sum, item) => sum + (item.priceSell * item.qty), 0)

    let activeDiscountLabel = ""
    let discountPct = 0
    let discountAmt = 0

    if (appliedPromo) {
        discountPct = appliedPromo.percentage
        discountAmt = Number(((subtotal * discountPct) / 100).toFixed(2))
        activeDiscountLabel = `Discount (${discountPct}%)`
    } else if (shopSettings.autoDiscountEnabled && subtotal >= (shopSettings.autoDiscountThreshold || 5000)) {
        discountPct = shopSettings.autoDiscountPercentage || 2
        discountAmt = Number(((subtotal * discountPct) / 100).toFixed(2))
        activeDiscountLabel = `Auto Discount (${discountPct}%)`
    }

    const discountAmount = discountAmt
    const grandTotal = subtotal - discountAmount

    const handleCheckout = async (paymentMethod: string) => {
        if (cart.length === 0) {
            alert('Cart is empty!')
            return
        }

        if (paymentMethod === 'UPI') {
            setShowUPIModal(true)
            return
        }

        await finalizeCheckout(paymentMethod)
    }

    const finalizeCheckout = async (paymentMethod: string) => {
        if (isCheckingOut) return
        setIsCheckingOut(true)
        setShowUPIModal(false)
        try {
            const res = await createOrder(cart, paymentMethod, grandTotal, activeCustomer?.id || null, appliedPromo?.code || null)
            if (res?.error) {
                alert(res.error)
            } else if (res?.success && res.orderId) {
                setCart([])
                clearCustomer()
                showToast(`✅ ${paymentMethod} Payment Successful`)
                // Refocus scanner after short timeout
                setTimeout(() => searchInputRef.current?.focus(), 100)
                router.push(`/pos/bill/${res.orderId}`)
            }
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Checkout failed.')
        } finally {
            setIsCheckingOut(false)
        }
    }

    if (!mounted) return null

    // Filter for manual grid (optional, can hide if scanning is primary)
    const filteredProducts = products.filter(p => !search || (p.name && p.name.toLowerCase().includes(search.toLowerCase())))

    // --- HELPER MODE (Mobile Only) ---
    if (userRole === 'HELPER') {
        const product = scanResult || (search && filteredProducts.length === 1 ? filteredProducts[0] : null)

        // Helper-specific scan handler (simplified)
        const handleHelperScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                const query = search.trim()
                if (!query) return

                const found = products.find(p => p.barcode === query) ||
                    products.find(p => p.name && p.name.toLowerCase() === query.toLowerCase())

                if (found) {
                    setScanResult(found)
                    setSearch('')
                } else {
                    alert('Product not found')
                    setSearch('')
                }
            }
        }

        return (
            <div className={styles.helperContainer}>
                <div className={styles.helperHeader}>
                    <div className={styles.helperTitle} onClick={() => router.push('/')}>ShopLedger</div>
                    <div className={styles.helperBadge}>HELPER MODE</div>
                    <form action="/api/auth/logout" method="POST" style={{ position: 'absolute', left: '16px' }}>
                        <button type="submit" className={styles.iconBtn} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>

                <div className={styles.helperContent}>
                    <div className={styles.helperInputContainer}>
                        <Search className={styles.helperIcon} size={20} />
                        <input
                            className={styles.helperInput}
                            placeholder="Scan barcode or enter SKU"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value)
                                if (!e.target.value) setScanResult(null)
                            }}
                            onKeyDown={handleHelperScan}
                            autoFocus
                            type="search"
                        />
                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: '#9ca3af' }}>
                            Scan to check price and stock
                        </div>
                    </div>

                    {scanResult ? (
                        <div className={styles.helperResultCard}>
                            {scanResult.image ? (
                                <img src={scanResult.image} className={styles.helperImage} alt={scanResult.name} />
                            ) : (
                                <div className={styles.helperImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                            )}

                            <div className={styles.helperInfo}>
                                <h2>{scanResult.name}</h2>
                                <div className={styles.helperCategory}>SKU: {scanResult.barcode}</div>
                                <div className={styles.helperPrice}>₹{scanResult.priceSell}</div>

                                <div className={`${styles.stockBadgeLarge} ${scanResult.stock > 10 ? styles.stockIn :
                                    scanResult.stock > 0 ? styles.stockLow : styles.stockOut
                                    }`}>
                                    {scanResult.stock > 10 ? 'In Stock' :
                                        scanResult.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                    <span style={{ marginLeft: '6px', opacity: 0.8 }}>({scanResult.stock})</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setScanResult(null); setSearch('') }}
                                style={{
                                    marginTop: '8px',
                                    padding: '12px',
                                    background: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    color: '#4b5563',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Result
                            </button>
                        </div>
                    ) : (
                        <div className={styles.helperEmptyState}>
                            <ScanLine size={48} style={{ opacity: 0.2 }} />
                            <div>Scan a product to check price</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.logoIcon}>🛍️</div>
                    <h1>ShopLedger</h1>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.modeBadge}>{userRole} MODE</div>
                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className={styles.iconBtn} title="Logout">
                            <LogOut size={20} className={styles.logoutText} />
                        </button>
                    </form>
                </div>
            </header>

            <div className={styles.mainContent}>
                {/* LEFT PANE */}
                <div className={styles.leftPane}>

                    {/* CUSTOMER SECTION */}
                    {activeCustomer ? (
                        <div className={styles.customerSection} style={{ padding: '0.75rem 1.5rem' }}>
                            <div className={styles.customerActiveInfo}>
                                <div style={{ fontWeight: 600 }}>{activeCustomer.name || 'Customer'} ({activeCustomer.phone})</div>
                                <div style={{ fontSize: '0.85rem' }}>Visits: {activeCustomer.visitCount}</div>
                                {activeCustomer.visitCount >= 5 && <div className={styles.loyalBadge}>Loyal Customer</div>}
                            </div>
                            <button onClick={clearCustomer} className={`${styles.customerBtn} ${styles.customerBtnClear}`}>Clear Customer</button>
                        </div>
                    ) : (
                        <div className={styles.customerSection}>
                            <div className={styles.customerHeader}>
                                <div>📱 WhatsApp (Optional)</div>
                            </div>
                            <div className={styles.customerInputs}>
                                <input
                                    type="tel"
                                    className={styles.customerInput}
                                    placeholder="10-digit phone"
                                    value={customerPhone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setCustomerPhone(val);
                                        if (val.length === 10) {
                                            // Optional: auto trigger save here, disabled for now
                                        }
                                    }}
                                    maxLength={10}
                                />
                                <input
                                    type="text"
                                    className={styles.customerInput}
                                    placeholder="Name (Optional)"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveCustomer}
                                    className={styles.customerBtn}
                                    disabled={isSavingCustomer || customerPhone.length !== 10}
                                    style={{ opacity: customerPhone.length !== 10 ? 0.5 : 1 }}
                                >
                                    {isSavingCustomer ? 'Wait...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCAN HERO */}
                    {!scanResult ? (
                        <div className={styles.scanHero}>
                            <div className={styles.scanInputContainer}>
                                <ScanLine className={styles.scanIcon} size={24} />
                                <input
                                    ref={searchInputRef}
                                    className={styles.scanInputLarge}
                                    placeholder="Scan barcode or type SKU..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={handleScan}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.scanControls}>
                                <label className={styles.instantAddToggle}>
                                    <div className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={instantAdd}
                                            onChange={e => setInstantAdd(e.target.checked)}
                                        />
                                        <span className={styles.slider}></span>
                                    </div>
                                    <span className={styles.toggleLabel}>Instant Add Mode</span>
                                </label>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    Press Enter to Search
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SCAN RESULT CARD */
                        <div className={styles.scanResultCard}>
                            <div className={styles.resultContent}>
                                {scanResult.image ? (
                                    <img
                                        src={scanResult.image}
                                        alt={scanResult.name}
                                        className={styles.resultImage}
                                    />
                                ) : (
                                    <div className={styles.resultImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.8rem' }}>
                                        No Image
                                    </div>
                                )}
                                <div className={styles.resultInfo}>
                                    <div className={styles.resultName}>{scanResult.name}</div>
                                    <div className={styles.resultMeta}>Stock: {scanResult.stock} | SKU: {scanResult.barcode}</div>
                                    <div className={styles.resultPrice}>₹{scanResult.priceSell}</div>
                                </div>
                            </div>

                            <div className={styles.resultActions}>
                                <div className={styles.qtySelectorLarge}>
                                    <button onClick={() => setScanQty(q => Math.max(1, q - 1))} className={styles.qtyBtn}><Minus size={20} /></button>
                                    <div className={styles.qtyValue}>{scanQty}</div>
                                    <button onClick={() => setScanQty(q => q + 1)} className={styles.qtyBtn}><Plus size={20} /></button>
                                </div>
                                <button onClick={confirmScanAdd} className={styles.addToCartBtn}>
                                    ADD TO CART - ₹{(scanResult.priceSell * scanQty).toFixed(2)}
                                </button>
                                <button onClick={cancelScan} className={styles.cancelScanBtn}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PRODUCT GRID (Scrollable below) */}
                    <div className={styles.grid}>
                        {filteredProducts.slice(0, 50).map(p => (
                            <button key={p.id} className={styles.card} onClick={() => addToCart(p, 1)}>
                                <div className={styles.cardImage}>
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} />
                                    ) : (
                                        <div className={styles.noImagePlaceholder}>
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardName}>{p.name}</div>
                                <div className={styles.cardBottom}>
                                    <div className={styles.cardPrice}>₹{p.priceSell}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                </div>

                {/* RIGHT PANE (Cart) */}
                <div className={styles.rightPane}>
                    <div className={styles.cartHeader}>
                        <h2>Current Bill ({cart.length} Items)</h2>
                        <button onClick={clearCart} className={styles.clearBtn}>CLEAR</button>
                    </div>

                    <div className={styles.cartItems}>
                        {cart.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemName}>{item.name}</div>
                                    <div className={styles.itemMeta}>₹{item.priceSell} x {item.qty}</div>
                                </div>
                                <div className={styles.itemActions}>
                                    <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                                    <button onClick={() => removeFromCart(item.id)} className={styles.delBtn}><X size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Cart is empty</div>}
                    </div>

                    <div className={styles.cartFooter}>
                        {/* PROMO INPUT SECTION */}
                        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                            {appliedPromo ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <div style={{ fontWeight: 600, color: '#059669' }}>{appliedPromo.code} Applied</div>
                                        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>{appliedPromo.title} (-{appliedPromo.percentage}%)</div>
                                    </div>
                                    <button onClick={clearPromo} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Remove Promo">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Promo Code"
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', textTransform: 'uppercase', outline: 'none' }}
                                        value={promoCodeInput}
                                        onChange={e => setPromoCodeInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        disabled={isValidatingPromo || !promoCodeInput.trim()}
                                        style={{ padding: '10px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: (!promoCodeInput.trim() || isValidatingPromo) ? 0.5 : 1 }}
                                    >
                                        {isValidatingPromo ? '...' : 'Apply'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={styles.totalRow} style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className={styles.totalRow} style={{ fontSize: '1rem', color: '#059669', marginBottom: '8px' }}>
                                <span>{activeDiscountLabel}</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className={styles.totalRow} style={{ borderTop: discountAmount > 0 ? '1px dashed #e5e7eb' : 'none', paddingTop: discountAmount > 0 ? '8px' : '0' }}>
                            <span>TOTAL</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <div className={styles.payButtons}>
                            <button className={styles.payBtn} onClick={() => handleCheckout('CASH')} disabled={isCheckingOut}>
                                {isCheckingOut ? 'WAIT...' : 'CASH'}
                            </button>
                            <button className={styles.payBtn} onClick={() => handleCheckout('UPI')} disabled={isCheckingOut}>
                                {isCheckingOut ? 'WAIT...' : 'UPI'}
                            </button>
                            <button className={styles.payBtn} onClick={() => handleCheckout('CARD')} disabled={isCheckingOut}>
                                {isCheckingOut ? 'WAIT...' : 'CARD'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* UPI QR MODAL */}
            {showUPIModal && (
                <UPIQRModal
                    amount={grandTotal}
                    invoiceNumber={Date.now().toString().slice(-6)} // Using timestamp slice as temp visual invoice number since real ID generated after saving
                    shopName={shopSettings.name}
                    upiId={shopSettings.upiId}
                    onConfirm={() => finalizeCheckout('UPI')}
                    onCancel={() => setShowUPIModal(false)}
                />
            )}
        </div>
    )
}
