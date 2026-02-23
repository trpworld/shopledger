'use client'

import { useState } from 'react'
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/products'
import styles from './products.module.css'
import { Image as ImageIcon, Edit2, Trash2, Plus, History, Printer } from 'lucide-react'
import BarcodeModal from './BarcodeModal'

type Product = {
    id: string
    name: string
    barcode: string
    category: string
    priceBuy: number
    priceSell: number
    gstRate: number
    stock: number
    image?: string | null
}

export default function ProductClientObject({ initialProducts, userRole }: { initialProducts: Product[], userRole?: string }) {
    const [products, setProducts] = useState(initialProducts)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null)

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
    )

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        if (editingProduct) {
            await updateProduct(editingProduct.id, formData)
        } else {
            await createProduct(formData)
        }

        setIsModalOpen(false)
        setEditingProduct(null)
        window.location.reload()
    }

    async function handleDelete(id: string) {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id)
            window.location.reload()
        }
    }

    function openAddModal() {
        setEditingProduct(null)
        setIsModalOpen(true)
    }

    function openEditModal(product: Product) {
        setEditingProduct(product)
        setIsModalOpen(true)
    }

    function getStockBadgeClass(stock: number) {
        if (stock <= 0) return styles.stockRed
        if (stock <= 10) return styles.stockOrange
        return styles.stockGreen
    }

    return (
        <div className={styles.container}>
            {/* --- HEADER --- */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Product Management</h1>
                    <p>Manage inventory, prices, and stock levels</p>
                </div>
                <div className={styles.actionsSection}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.search}
                    />
                    {userRole !== 'HELPER' && (
                        <button onClick={openAddModal} className={styles.addButton}>
                            <Plus size={18} /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* --- PRODUCT LIST --- */}
            <div className={styles.productList}>
                {filteredProducts.map(product => (
                    <div key={product.id} className={styles.productRow}>
                        {/* 1. Image */}
                        <div className={styles.imageWrapper}>
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className={styles.productImage}
                                    onClick={() => window.open(product.image!, '_blank')}
                                />
                            ) : (
                                <ImageIcon size={24} className={styles.placeholderIcon} />
                            )}
                        </div>

                        {/* 2. Info */}
                        <div className={styles.productInfo}>
                            <div className={styles.productName}>{product.name}</div>
                            <div className={styles.productCategory}>{product.category}</div>
                            <div className={styles.productBarcode}>{product.barcode}</div>
                        </div>

                        {/* 3. Meta (Stock) */}
                        <div className={styles.productMeta}>
                            <div className={`${styles.stockBadge} ${getStockBadgeClass(product.stock)}`}>
                                {product.stock <= 0 ? 'Out of Stock' : `${product.stock} in stock`}
                            </div>
                        </div>

                        {/* 4. Meta (Price) */}
                        <div className={styles.productMeta}>
                            <div className={styles.price}>₹{product.priceSell}</div>
                            {userRole !== 'HELPER' && (
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Buy: ₹{product.priceBuy}</div>
                            )}
                        </div>

                        {/* 5. Actions */}
                        <div className={styles.actions}>
                            <button
                                onClick={() => window.location.href = `/dashboard/products/history?productId=${product.id}`}
                                className={styles.actionBtn}
                                title="History"
                            >
                                <History size={16} />
                            </button>
                            <button
                                onClick={() => setBarcodeProduct(product)}
                                className={styles.actionBtn}
                                title="Print Label"
                            >
                                <Printer size={16} />
                            </button>
                            {userRole !== 'HELPER' && (
                                <>
                                    <button onClick={() => openEditModal(product)} className={styles.actionBtn} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input name="name" defaultValue={editingProduct?.name} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Category</label>
                                <select name="category" defaultValue={editingProduct?.category || 'Gift'} required>
                                    <option value="Gift">Gift</option>
                                    <option value="Toys">Toys</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Cosmetics">Cosmetics</option>
                                    <option value="Stationery">Stationery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Barcode</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input name="barcode" defaultValue={editingProduct?.barcode} required style={{ flex: 1 }} />
                                    <button type="button"
                                        onClick={(e) => {
                                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                                            input.value = Date.now().toString().slice(-8);
                                        }}
                                        style={{ padding: '0 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    >Gen</button>
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Buy Price</label>
                                    <input name="priceBuy" type="number" step="0.01" defaultValue={editingProduct?.priceBuy} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Sell Price (MRP)</label>
                                    <input name="priceSell" type="number" step="0.01" defaultValue={editingProduct?.priceSell} required />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>GST %</label>
                                    <select name="gstRate" defaultValue={editingProduct?.gstRate || 0}>
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Stock</label>
                                    <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Product Photo</label>
                                <input name="image" type="file" accept="image/*" style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', width: '100%' }} />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.saveBtn}>Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- BARCODE MODAL --- */}
            {barcodeProduct && (
                <BarcodeModal
                    product={barcodeProduct}
                    onClose={() => setBarcodeProduct(null)}
                />
            )}
        </div>
    )
}
