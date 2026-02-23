import { validatePromoCode } from './app/actions/offer-admin.ts'

async function main() {
    try {
        console.log("running...")
        console.log(await validatePromoCode("NEXT15"))
    } catch (e) {
        console.error(e)
    }
}
main()
