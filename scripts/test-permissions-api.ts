
// This script interacts with the RUNNING server at localhost:3001
// It uses /api/test-token to get a valid token, then probes permissions.

const BASE_URL = 'http://localhost:3001'

const CHECKS = [
    { url: `${BASE_URL}/dashboard`, roles: ['OWNER'], label: 'Owner Dashboard' },
    { url: `${BASE_URL}/dashboard/reports`, roles: ['OWNER'], label: 'Financial Reports' },
    { url: `${BASE_URL}/pos`, roles: ['OWNER', 'CASHIER', 'HELPER'], label: 'POS Terminal' },
    // API Products might be open or protected, let's see. 
    // Usually protected by middleware.
    { url: `${BASE_URL}/api/products`, roles: ['OWNER', 'CASHIER', 'HELPER'], label: 'API Products' }
]

const USERS = [
    { name: 'Owner', role: 'OWNER', id: 'TEST_OWNER' },
    { name: 'Cashier', role: 'CASHIER', id: 'TEST_CASHIER' },
    { name: 'Helper', role: 'HELPER', id: 'TEST_HELPER' }
]

async function testPermissions() {
    console.log('--- Testing Permission Matrix (via API) ---')

    for (const user of USERS) {
        console.log(`\n👤 Testing as ${user.name} (${user.role})...`)

        // 1. Get Token from Server
        let token = ''
        try {
            const tokenRes = await fetch(`${BASE_URL}/api/test-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user })
            })
            if (!tokenRes.ok) throw new Error(`Failed to get token: ${tokenRes.status}`)
            const data = await tokenRes.json()
            token = data.token
        } catch (e) {
            console.error(`   ❌ Setup Error: Server not running or API missing? ${(e as Error).message}`)
            return
        }

        // 2. Check each URL
        for (const check of CHECKS) {
            const isAllowed = check.roles.includes(user.role)

            try {
                const res = await fetch(check.url, {
                    headers: {
                        'Cookie': `session=${token}`
                    },
                    redirect: 'manual'
                })

                const status = res.status
                const loc = res.headers.get('location')

                let result = 'UNKNOWN'

                // Allow 200 for allowed
                if (status === 200) {
                    if (isAllowed) result = 'PASS'
                    else result = 'FAIL (Access Granted but should be Denied)'
                }
                // Allow 307/308/403 for denied
                else if (status === 307 || status === 308 || status === 403 || status === 302) {
                    if (!isAllowed) result = 'PASS (Access Denied)'
                    else {
                        // As discussed, Cashier accessing Dashboard might 307 to Login/POS.
                        // But if Owner gets 307 on Dashboard, that's FAIL.
                        result = 'FAIL (Redirected but should be Allowed)'
                    }
                } else {
                    result = `FAIL (Unexpected Status ${status})`
                }

                // Special Case: Cashier on Dashboard -> Middleware redirects to POS.
                // If we get 307 to /pos? Or /login?
                // Actually, if status is 307 and Location is present, it's a redirect.

                // If the user is NOT allowed, any 3xx/4xx is good.
                if (!isAllowed && result.startsWith('PASS')) {
                    // Good.
                }

                const icon = result.startsWith('PASS') ? '✅' : '❌'
                console.log(`   [${check.label}] ${icon} Status: ${status} ${loc ? '-> ' + loc : ''}`)

            } catch (e) {
                console.error(`   [${check.label}] ❌ Error: ${(e as Error).message}`)
            }
        }
    }
}

testPermissions()
