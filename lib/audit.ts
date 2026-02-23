import { db } from '@/lib/db'

export async function logAudit(userId: string, action: string, details: any) {
    try {
        await db.auditLog.create({
            data: {
                userId,
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details),
            },
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
        // Don't throw, as we don't want to break the user flow if logging fails
    }
}
