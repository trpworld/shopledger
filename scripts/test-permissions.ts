
// Set the secret to match .env so signatures match the running server
process.env.JWT_SECRET = "secretKey" // Testing fallback hypothesis

import { encrypt } from '../lib/session'

// Define the roles and their expected access
// URL -> [Allowed Roles]
const CHECKS = [
    { url: 'http://localhost:3001/dashboard', roles: ['OWNER'], label: 'Owner Dashboard' },
    { url: 'http://localhost:3001/dashboard/reports', roles: ['OWNER'], label: 'Financial Reports' },
    { url: 'http://localhost:3001/pos', roles: ['OWNER', 'CASHIER', 'HELPER'], label: 'POS Terminal' },
    { url: 'http://localhost:3001/api/products', roles: ['OWNER', 'CASHIER', 'HELPER'], label: 'API Products' }
    // Note: API might keys off middleware or session too.
]

const USERS = [
    { name: 'Owner', role: 'OWNER', id: 'TEST_OWNER' },
    { name: 'Cashier', role: 'CASHIER', id: 'TEST_CASHIER' },
    { name: 'Helper', role: 'HELPER', id: 'TEST_HELPER' }
]

async function testPermissions() {
    console.log('--- Testing Permission Matrix ---')

    for (const user of USERS) {
        console.log(`\n👤 Testing as ${user.name} (${user.role})...`)

        // 1. Generate Session Token
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const token = await encrypt({ user, expires })

        // 2. Check each URL
        for (const check of CHECKS) {
            const isAllowed = check.roles.includes(user.role)

            try {
                const res = await fetch(check.url, {
                    headers: {
                        'Cookie': `session=${token}`
                    },
                    redirect: 'manual' // Don't follow redirects automatically so we can see 307
                })

                // Logic:
                // If Allowed: Should be 200 OK.
                // If Denied: Should be 307 (Redirect to /login or /pos) or 403.

                const status = res.status
                const loc = res.headers.get('location')

                let result = 'UNKNOWN'

                if (status === 200) {
                    if (isAllowed) result = 'PASS'
                    else result = 'FAIL (Access Granted but should be Denied)'
                } else if (status === 307 || status === 302 || status === 403) {
                    if (!isAllowed) result = 'PASS (Access Denied)'
                    else {
                        // Redirect might be okay if it's the login page redirecting to dashboard?
                        // But we provided a valid token.
                        // If 307 to /login, our token might be invalid?
                        // If 307 to /pos (for Cashier accessing Dashboard), that's a PASS?
                        // Wait, Middleware redirects Login -> POS.
                        // Dashboard Layout redirects Non-Owner -> Login.
                        // So Cashier -> Dashboard -> Layout(Server) -> Redirect Login -> Middleware -> Redirect POS.
                        // So we expect 307.
                        result = 'FAIL (Redirected but should be Allowed)'
                        // Wait, if I am Owner and I get 307, that's bad.
                    }
                }

                // Refinements for Cashier/Helper on Dashboard:
                // They are NOT allowed. They get 307. This is PASS.
                if (!isAllowed && (status === 307 || status === 308)) {
                    result = 'PASS (Redirected correctly)'
                }

                console.log(`   [${check.label}] ${result === 'PASS' || result.startsWith('PASS') ? '✅' : '❌'} Status: ${status} ${loc ? '-> ' + loc : ''}`)

            } catch (e) {
                console.error(`   [${check.label}] ❌ Error: ${(e as Error).message}`)
            }
        }
    }
}

testPermissions()
