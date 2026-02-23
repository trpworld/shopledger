'use client'

import { useState, useEffect } from 'react'
import Barcode from 'react-barcode'
import styles from './print.module.css'

type Product = {
    id: string
    name: string
    barcode: string
    priceSell: number
}

export default function PrintLabelsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        // Fetch products for selection
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
    }, [])

    const product = products.find(p => p.id === selectedProduct)

    return (
        <div className={styles.container}>
            <div className={styles.noPrint}>
                <h1>Print Barcode Labels</h1>
                <div className={styles.controls}>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - {p.barcode}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className={styles.input}
                    />
                    <button onClick={() => window.print()} className={styles.printBtn}>Print</button>
                </div>
            </div>

            <div className={styles.printArea}>
                {product && Array.from({ length: quantity }).map((_, i) => (
                    <div key={i} className={styles.label}>
                        <div className={styles.labelName}>{product.name.substring(0, 20)}</div>
                        <Barcode value={product.barcode} width={1.5} height={40} fontSize={12} />
                        <div className={styles.labelPrice}>Rs. {product.priceSell}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
