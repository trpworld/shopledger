import { getSettings } from '@/app/actions/settings'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
    const session = await getSession()

    if (!session || session.user.role !== 'OWNER') {
        redirect('/dashboard/products')
    }

    const settings = await getSettings()

    return <SettingsClient initialSettings={settings} />
}
