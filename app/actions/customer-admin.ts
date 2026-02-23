'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const verifyOwner = async () => {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        throw new Error('Unauthorized')
    }
}

export async function getCustomers() {
    await verifyOwner()
    const customers = await db.customer.findMany({
        orderBy: { lastVisit: 'desc' }
    })
    return customers
}

export async function toggleCustomerOffers(customerId: string, allowOffers: boolean) {
    await verifyOwner()
    try {
        await db.customer.update({
            where: { id: customerId },
            data: { allowOffers }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function deleteCustomer(customerId: string) {
    await verifyOwner()
    try {
        // Disconnect orders to preserve billing logic
        await db.order.updateMany({
            where: { customerId },
            data: { customerId: null }
        })

        await db.customer.delete({
            where: { id: customerId }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
