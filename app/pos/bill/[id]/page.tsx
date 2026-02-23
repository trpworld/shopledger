import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getSettings } from '@/app/actions/settings'
import styles from './bill.module.css'
import PrintButton from './PrintButton'
import Link from 'next/link'

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getSession()
    if (!session) redirect('/login')

    const order = await db.order.findUnique({
        where: { id },
        include: {
            items: { include: { product: true } },
            customer: true
        }
    })

    if (!order) return <div>Order not found</div>

    const settings = await getSettings()

    const shopName = settings.SHOP_NAME || "Retail Shop"
    const shopPhone = settings.SHOP_MOBILE || ""
    const gstNumber = settings.GST_NUMBER || ""
    const autoPrint = settings.AUTO_PRINT === 'true'

    // Fetch Active Offer
    const activeOffer = await db.offer.findFirst({
        where: { isActive: true }
    })
    const isValidOffer = activeOffer && new Date(activeOffer.validTill) > new Date()

    const discountAmount = Number((order as any).discountAmount) || 0
    const discountPercentage = Number((order as any).discountPercentage) || 0
    const finalPaidAmount = Number(order.totalAmount)
    const subtotal = finalPaidAmount + discountAmount

    const items = order.items.map(i => ({
        id: i.id,
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.price),
        gstRate: Number(i.gstRate)
    }))

    // Calculate total embedded GST (assuming price is inclusive of GST)
    // Formula for inclusive tax amount: Price - (Price / (1 + (Rate/100)))
    const customGstSummary = items.reduce((acc, item) => {
        const itemTotal = item.price * item.quantity;
        const taxAmount = itemTotal - (itemTotal / (1 + (item.gstRate / 100)));
        return acc + taxAmount;
    }, 0)

    // WhatsApp Message Generation
    let waMessageRaw = `*${shopName}*\n` +
        `Bill #${order.id}\n` +
        `Date: ${order.createdAt.toLocaleDateString('hi-IN')}\n` +
        `----------------\n` +
        items.map(i => `${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join('\n') +
        `\n----------------\n` +
        (discountAmount > 0 ? `Subtotal: ₹${subtotal.toFixed(2)}\nDiscount${discountPercentage > 0 ? ` (${discountPercentage}%)` : ''}: -₹${discountAmount.toFixed(2)}\n` : '') +
        `*Total: ₹${finalPaidAmount.toFixed(2)}*\n` +
        `Payment Mode: ${order.paymentMode}\n` +
        `Thank you for shopping!`

    if (isValidOffer) {
        waMessageRaw += `\n\n🎁 *Special Offer:* ${activeOffer.title}\nValid Till: ${new Date(activeOffer.validTill).toLocaleDateString('hi-IN')}`
    }

    const waPhone = (order as any).customer?.phone || ''
    const waMessage = encodeURIComponent(waMessageRaw)

    return (
        <div className={styles.container}>
            <div className={styles.bill}>
                <div className={styles.header}>
                    <h2>{shopName}</h2>
                    {shopPhone && <p>Ph: {shopPhone}</p>}
                    {gstNumber && <p>GSTIN: {gstNumber}</p>}
                </div>

                <div className={styles.meta}>
                    <p>Bill No: {order.id}</p>
                    <p>Date: {order.createdAt.toLocaleString('hi-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>

                <hr className={styles.divider} />

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '50%' }}>Item</th>
                            <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Rate</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{item.price.toFixed(0)}</td>
                                <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toFixed(0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <hr className={styles.divider} />

                <div className={styles.summaryBox}>
                    <div className={styles.summaryRow}>
                        <span>Net Total (Excl. GST):</span>
                        <span>₹{(subtotal - customGstSummary).toFixed(2)}</span>
                    </div>
                    {customGstSummary > 0 && (
                        <div className={styles.summaryRow}>
                            <span>GST Included:</span>
                            <span>₹{customGstSummary.toFixed(2)}</span>
                        </div>
                    )}
                    {discountAmount > 0 && (
                        <div className={styles.summaryRow} style={{ color: '#059669', fontWeight: 600 }}>
                            <span>Discount{discountPercentage > 0 ? ` (${discountPercentage}%)` : ''}:</span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <hr className={styles.dividerLight} />
                    <div className={styles.grandTotalRow}>
                        <span>Grand Total:</span>
                        <span>₹{finalPaidAmount.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow} style={{ marginTop: '4px', fontSize: '11px' }}>
                        <span>Paid via:</span>
                        <span style={{ fontWeight: 'bold' }}>{order.paymentMode}</span>
                    </div>
                </div>

                {isValidOffer && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px dashed #111827', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>🎁 Special Offer</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{activeOffer.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '4px' }}>
                            Valid Till: {new Date(activeOffer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    <p>** Thank You! Visit Again **</p>
                    <p style={{ marginTop: '4px', fontSize: '9px', color: '#666' }}>Software by ShopLedger</p>
                </div>
            </div>

            <div className={styles.actions}>
                <Link href="/pos" className={styles.backBtn}>New Bill</Link>
                <PrintButton className={styles.printBtn} autoPrint={autoPrint} />
                <a href={`https://api.whatsapp.com/send/?phone=${waPhone}&text=${waMessage}`} target="_blank" className={styles.waBtn}>WhatsApp</a>
            </div>
        </div>
    )
}
