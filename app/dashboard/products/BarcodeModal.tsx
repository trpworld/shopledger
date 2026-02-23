'use client'

import React, { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { X, Download, Printer } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useReactToPrint } from 'react-to-print'

type Product = {
    id: string
    name: string
    barcode: string
    priceSell: number
    gstRate: number
}

type SizeOption = '50x25' | '75x40' | 'A4'

export default function BarcodeModal({ product, onClose }: { product: Product, onClose: () => void }) {
    const barcodeRef = useRef<SVGSVGElement>(null)
    const labelRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<SizeOption>('50x25')
    const [copies, setCopies] = useState(1)

    // Generate Barcode on Mount or Product Change
    useEffect(() => {
        if (barcodeRef.current && product.barcode) {
            JsBarcode(barcodeRef.current, product.barcode, {
                format: "CODE128",
                displayValue: false, // We render the SKU text manually for better control
                lineColor: "#000",
                background: "#fff",
                width: 2,
                height: 50,
                margin: 0,
            })
        }
    }, [product.barcode])

    // Print Handler (Thermal optimized native print)
    const handlePrint = useReactToPrint({
        contentRef: labelRef,
        documentTitle: `Label_${product.barcode}`,
        pageStyle: `
            @page { size: auto; margin: 0mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `
    })

    // PNG Download Handler
    const downloadPNG = async () => {
        if (!labelRef.current) return
        try {
            const canvas = await html2canvas(labelRef.current, { scale: 4 }) // High res
            const link = document.createElement('a')
            link.download = `${product.name}-barcode.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (error) {
            console.error("Failed to generate PNG", error)
        }
    }

    // PDF Download Handler
    const downloadPDF = async () => {
        if (!labelRef.current) return
        try {
            const canvas = await html2canvas(labelRef.current, { scale: 4 })
            const imgData = canvas.toDataURL('image/jpeg', 1.0)

            // Default assumes mm unit
            let pdfWidth = 50
            let pdfHeight = 25

            if (size === '75x40') {
                pdfWidth = 75
                pdfHeight = 40
            } else if (size === 'A4') {
                pdfWidth = 210
                pdfHeight = 297
            }

            const pdf = new jsPDF({
                orientation: size === 'A4' ? 'portrait' : 'landscape',
                unit: 'mm',
                format: size === 'A4' ? 'a4' : [pdfHeight, pdfWidth]
            })

            if (size === 'A4') {
                // Generate a grid of labels for A4
                const cols = 4
                const rows = 10
                const lWidth = 45
                const lHeight = 25
                const marginX = 10
                const marginY = 10

                let count = 0
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (count >= copies) break
                        const x = marginX + (c * (lWidth + 3))
                        const y = marginY + (r * (lHeight + 3))
                        pdf.addImage(imgData, 'JPEG', x, y, lWidth, lHeight)
                        count++
                    }
                }
            } else {
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
            }

            pdf.save(`${product.name}-labels.pdf`)
        } catch (error) {
            console.error("Failed to generate PDF", error)
        }
    }

    // Dynamic sizing for the preview container
    const getContainerStyles = () => {
        switch (size) {
            case '50x25':
                return { width: '50mm', height: '25mm' }
            case '75x40':
                return { width: '75mm', height: '40mm' }
            case 'A4':
                // For preview sake, we just show a single label big when A4 is selected,
                // but physically limit the actual printable area
                return { width: '50mm', height: '25mm' }
            default:
                return { width: '50mm', height: '25mm' }
        }
    }

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Generate Label</h2>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={bodyStyle}>

                    {/* Size Controls */}
                    <div style={controlsRow}>
                        <div style={formGroup}>
                            <label style={labelStyle}>Label Size</label>
                            <select value={size} onChange={(e) => setSize(e.target.value as SizeOption)} style={inputStyle}>
                                <option value="50x25">50mm x 25mm (Small Sticker)</option>
                                <option value="75x40">75mm x 40mm (Large Sticker)</option>
                                <option value="A4">A4 Sheet (Multiple Grid)</option>
                            </select>
                        </div>
                        {size === 'A4' && (
                            <div style={formGroup}>
                                <label style={labelStyle}>Copies (for A4)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="40"
                                    value={copies}
                                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                                    style={inputStyle}
                                />
                            </div>
                        )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', textAlign: 'center' }}>
                        Preview (Actual print quality will be higher)
                    </p>

                    {/* Preview Container wrapper (to center it nicely) */}
                    <div style={previewWrapperStyle}>

                        {/* THE ACTUAL RETAIL LABEL NODE (Used for canvas/print export) */}
                        <div ref={labelRef} style={{ ...labelNodeStyle, ...getContainerStyles() }}>
                            <div style={productNameStyle}>
                                {product.name.substring(0, 30)}{product.name.length > 30 ? '...' : ''}
                            </div>
                            <div style={mrpStyle}>
                                MRP ₹{product.priceSell.toFixed(2)} (Incl. GST)
                            </div>
                            <div style={skuStyle}>
                                SKU No: {product.barcode}
                            </div>
                            <div style={barcodeWrapperStyle}>
                                <svg ref={barcodeRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }}></svg>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Actions Footer */}
                <div style={footerStyle}>
                    <button onClick={downloadPNG} style={actionBtnBase}>
                        <Download size={16} /> PNG
                    </button>
                    <button onClick={downloadPDF} style={actionBtnBase}>
                        <Download size={16} /> PDF
                    </button>
                    <button onClick={handlePrint} style={{ ...actionBtnBase, background: '#111827', color: 'white' }}>
                        <Printer size={16} /> Print Label
                    </button>
                </div>

            </div>
        </div>
    )
}

// INLINE STYLES FOR ISOLATION
const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
}

const modalStyle: React.CSSProperties = {
    background: 'white', borderRadius: '12px', width: '90%', maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden'
}

const headerStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb'
}

const closeBtnStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px'
}

const bodyStyle: React.CSSProperties = {
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f3f4f6'
}

const controlsRow: React.CSSProperties = {
    display: 'flex', gap: '1rem', flexWrap: 'wrap'
}

const formGroup: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '4px', flex: 1
}

const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem', fontWeight: 600, color: '#374151'
}

const inputStyle: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem'
}

const previewWrapperStyle: React.CSSProperties = {
    padding: '2rem', background: '#e5e7eb', borderRadius: '8px',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    border: '1px dashed #9ca3af', overflow: 'auto'
}

// --- ACTUAL PHYSICAL LABEL DESIGN ---
// This uses clean fonts, absolute alignment rules, and strict scaling constraints.
const labelNodeStyle: React.CSSProperties = {
    background: 'white',
    padding: '2mm',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#000', // STRICT BLACK INK
    boxSizing: 'border-box',
    overflow: 'hidden' // Force content bounds
}

const productNameStyle: React.CSSProperties = {
    fontSize: '8pt',
    fontWeight: 700,
    textAlign: 'center',
    width: '100%',
    lineHeight: '1',
    marginBottom: '1mm',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
}

const mrpStyle: React.CSSProperties = {
    fontSize: '6.5pt',
    fontWeight: 600,
    textAlign: 'center',
    width: '100%',
    marginBottom: '0.5mm'
}

const skuStyle: React.CSSProperties = {
    fontSize: '6pt',
    textAlign: 'center',
    width: '100%',
    marginBottom: '1mm'
}

const barcodeWrapperStyle: React.CSSProperties = {
    width: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0 // Allows flex shrink
}
// ------------------------------------

const footerStyle: React.CSSProperties = {
    padding: '1.25rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb',
    display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap'
}

const actionBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer', border: '1px solid #d1d5db', background: 'white', color: '#374151'
}
