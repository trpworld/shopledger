'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { writeFile } from 'fs/promises'
import { join } from 'path'

async function saveImage(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) return null
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const path = join(process.cwd(), 'public/uploads/products', filename)
    await writeFile(path, buffer)
    return `/uploads/products/${filename}`
}

export async function createProduct(formData: FormData) {
    try {
        const session = await getSession()
        if (!session || session.user.role !== 'OWNER') return { error: 'Unauthorized' }

        const name = formData.get('name') as string
        const barcode = formData.get('barcode') as string
        const category = formData.get('category') as string

        // Safer parsing
        const priceBuy = parseFloat((formData.get('priceBuy') as string) || '0')
        const priceSell = parseFloat((formData.get('priceSell') as string) || '0')
        const gstRate = parseFloat((formData.get('gstRate') as string) || '0')
        const stock = parseInt((formData.get('stock') as string) || '0')

        const imageFile = formData.get('image') as File | null

        // Ensure image saving is caught if it fails
        let imageUrl = null
        try {
            imageUrl = await saveImage(imageFile)
        } catch (imgError) {
            console.error('Image save failed:', imgError)
            // Continue without image? Or fail? Let's continue but log it.
        }

        let finalBarcode = barcode
        if (!finalBarcode || finalBarcode.trim() === '') {
            // Generate a mathematically random 8-digit barcode
            finalBarcode = Math.floor(10000000 + Math.random() * 90000000).toString()
        }

        if (!name) {
            return { error: 'Name is required.' }
        }

        await db.$transaction(async (tx: any) => {
            const product = await tx.product.create({
                data: {
                    name,
                    barcode: finalBarcode,
                    category,
                    priceBuy,
                    priceSell,
                    gstRate,
                    stock,
                    image: imageUrl,
                },
            })

            if (stock > 0) {
                await tx.stockLog.create({
                    data: {
                        productId: product.id,
                        change: stock,
                        reason: 'INITIAL',
                    }
                })
            }

            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'CREATE_PRODUCT',
                    details: JSON.stringify({ name, barcode, stock })
                }
            })
        })
        revalidatePath('/dashboard/products')
        return { success: true }
    } catch (error: any) {
        console.error('Create Product Error:', error)
        return { error: error.message || 'Failed to create product' }
    }
}

export async function updateProduct(id: string, formData: FormData) {
    try {
        const session = await getSession()
        if (!session || session.user.role !== 'OWNER') return { error: 'Unauthorized' }

        const name = formData.get('name') as string
        const barcode = formData.get('barcode') as string
        const category = formData.get('category') as string
        const priceBuy = parseFloat((formData.get('priceBuy') as string) || '0')
        const priceSell = parseFloat((formData.get('priceSell') as string) || '0')
        const gstRate = parseFloat((formData.get('gstRate') as string) || '0')
        const stock = parseInt((formData.get('stock') as string) || '0')

        const imageFile = formData.get('image') as File | null
        let imageUrl = null
        if (imageFile && imageFile.size > 0) {
            try {
                imageUrl = await saveImage(imageFile)
            } catch (imgError) {
                console.error('Image upload failed during update:', imgError)
            }
        }

        await db.$transaction(async (tx: any) => {
            const currentProduct = await tx.product.findUnique({ where: { id } })
            if (!currentProduct) throw new Error('Product not found')

            const stockDiff = stock - currentProduct.stock

            await tx.product.update({
                where: { id },
                data: {
                    name,
                    barcode,
                    category,
                    priceBuy,
                    priceSell,
                    gstRate,
                    stock,
                    ...(imageUrl && { image: imageUrl }),
                },
            })

            if (stockDiff !== 0) {
                await tx.stockLog.create({
                    data: {
                        productId: id,
                        change: stockDiff,
                        reason: 'CORRECTION',
                    }
                })
            }

            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE_PRODUCT',
                    details: JSON.stringify({ id, name, stockChange: stockDiff })
                }
            })
        })
        revalidatePath('/dashboard/products')
        return { success: true }
    } catch (error: any) {
        console.error('Update Product Error:', error)
        return { error: error.message || 'Failed to update product' }
    }
}

export async function deleteProduct(id: string) {
    try {
        const session = await getSession()
        if (!session || session.user.role !== 'OWNER') return { error: 'Unauthorized' }

        await db.$transaction(async (tx) => {
            await tx.product.update({
                where: { id },
                data: { isActive: false },
            })

            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETE_PRODUCT',
                    details: JSON.stringify({ id })
                }
            })
        })
        revalidatePath('/dashboard/products')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Product Error:', error)
        return { error: 'Failed to delete product' }
    }
}
