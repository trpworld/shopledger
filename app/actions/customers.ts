'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Find an existing customer by phone or create a new one, then increment visit count
export async function findOrCreateCustomer(phone: string, name?: string) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
        return { error: 'Invalid 10-digit phone number' }
    }

    try {
        let customer = await db.customer.findUnique({
            where: { phone }
        })

        if (customer) {
            // Update existing customer's visit count and last visit timestamp
            customer = await db.customer.update({
                where: { phone },
                data: {
                    visitCount: { increment: 1 },
                    lastVisit: new Date(),
                    ...(name ? { name } : {}) // Update name if provided and wasn't there before
                }
            })
        } else {
            // Create new customer
            customer = await db.customer.create({
                data: {
                    phone,
                    name: name || null,
                    visitCount: 1,
                    lastVisit: new Date(),
                }
            })
        }

        return { success: true, customer }
    } catch (error) {
        console.error('[findOrCreateCustomer] Error:', error)
        return { error: 'Failed to process customer logic' }
    }
}
