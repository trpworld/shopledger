import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import OffersClient from './offers-client'
import { getOffers } from '@/app/actions/offer-admin'

export default async function OffersPage() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        redirect('/dashboard')
    }

    const offers = await getOffers()

    return <OffersClient initialOffers={offers} />
}
