'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export type SettingsMap = {
    SHOP_NAME: string
    UPI_ID: string
    SHOP_MOBILE: string
    GST_NUMBER: string
    AUTO_PRINT: string
    RESET_ORDER_DAILY: string
    AUTO_DISCOUNT_ENABLED: string
    AUTO_DISCOUNT_THRESHOLD: string
    AUTO_DISCOUNT_PERCENTAGE: string
}

const DEFAULT_SETTINGS = {
    SHOP_NAME: 'My Retail Shop',
    UPI_ID: 'example@upi',
    SHOP_MOBILE: '9876543210',
    GST_NUMBER: '',
    AUTO_PRINT: 'false',
    RESET_ORDER_DAILY: 'true',
    AUTO_DISCOUNT_ENABLED: 'false',
    AUTO_DISCOUNT_THRESHOLD: '5000',
    AUTO_DISCOUNT_PERCENTAGE: '2'
}

export async function getSettings(): Promise<SettingsMap> {
    try {
        const settingsFromDb = await db.setting.findMany()

        // Convert array to map
        const settingsMap: any = { ...DEFAULT_SETTINGS }

        for (const setting of settingsFromDb) {
            settingsMap[setting.key] = setting.value
        }

        return settingsMap as SettingsMap
    } catch (error) {
        console.error("Failed to fetch settings, using defaults.", error)
        return DEFAULT_SETTINGS
    }
}

export async function updateSettings(formData: FormData) {
    try {
        const session = await getSession()
        if (!session || session.user.role !== 'OWNER') {
            return { error: 'Unauthorized. Only OWNER can modify settings.' }
        }

        const keysToUpdate = ['SHOP_NAME', 'UPI_ID', 'SHOP_MOBILE', 'GST_NUMBER', 'AUTO_PRINT', 'RESET_ORDER_DAILY', 'AUTO_DISCOUNT_ENABLED', 'AUTO_DISCOUNT_THRESHOLD', 'AUTO_DISCOUNT_PERCENTAGE']

        await db.$transaction(async (tx) => {
            for (const key of keysToUpdate) {
                const value = formData.get(key) as string
                if (value !== null) {
                    await tx.setting.upsert({
                        where: { key },
                        update: { value },
                        create: { key, value }
                    })
                }
            }

            // Log the action
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE_SETTINGS',
                    details: 'Updated shop configuration'
                }
            })
        })

        revalidatePath('/', 'layout') // Revalidate everything so nav and pos get updated

        return { success: true }
    } catch (error: any) {
        console.error("Failed to update settings:", error)
        return { error: error.message || "Failed to update settings" }
    }
}
