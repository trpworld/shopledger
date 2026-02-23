'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const verifyOwner = async () => {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        throw new Error('Unauthorized')
    }
}

export async function getOffers() {
    await verifyOwner()
    return await db.offer.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function createOffer(data: { title: string, code: string, message: string, discountPercentage: number, validTill: Date }) {
    await verifyOwner()
    try {
        const offer = await db.offer.create({
            data: {
                title: data.title,
                code: data.code.toUpperCase(),
                message: data.message,
                discountPercentage: data.discountPercentage,
                validTill: data.validTill,
            }
        })
        return { success: true, offer }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updateOffer(id: string, data: { title: string, code: string, message: string, discountPercentage: number, validTill: Date }) {
    await verifyOwner()
    try {
        const offer = await db.offer.update({
            where: { id },
            data: {
                title: data.title,
                code: data.code.toUpperCase(),
                message: data.message,
                discountPercentage: data.discountPercentage,
                validTill: data.validTill,
            }
        })
        return { success: true, offer }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function toggleOfferActive(id: string, isActive: boolean) {
    await verifyOwner()
    try {
        // If activating, we might want to deactivate all others so only ONE is active on the receipt at a time.
        // The prompt says "If active offer exists ... print on bill". 
        // For small shops, enforcing 1 active offer at a time simplifies things.
        if (isActive) {
            await db.offer.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            })
        }

        const offer = await db.offer.update({
            where: { id },
            data: { isActive }
        })
        return { success: true, offer }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function getOptedInCustomerPhones() {
    await verifyOwner()
    const customers = await db.customer.findMany({
        where: { allowOffers: true },
        select: { phone: true, name: true }
    })
    return customers
}

export async function validatePromoCode(code: string) {
    try {
        const offer = await db.offer.findUnique({
            where: { code: code.toUpperCase() }
        })
        if (!offer) return { error: "Invalid promo code" }
        if (!offer.isActive) return { error: "Promo code is not active" }
        if (new Date(offer.validTill) < new Date()) return { error: "Promo code has expired" }

        return { success: true, discountPercentage: offer.discountPercentage, title: offer.title }
    } catch (e: any) {
        return { error: "Failed to validate promo code" }
    }
}
