# ShopLedger Data Restore Guide

While ShopLedger provides a convenient "Export Full Database Backup (JSON)" button in the Owner Settings dashboard, restoring this data requires manual intervention by a system administrator. This is a deliberate security and architectural choice: completely overwriting a live PostgreSQL database from a web interface is highly dangerous and prone to failure, especially if the database structure changes over time.

## How to Restore from a JSON Backup

If your live database is corrupted or you are migrating to a new Supabase project, follow these steps to restore the data from your downloaded `.json` backup file.

### Prerequisites
1. **Node.js**: Ensure Node.js is installed on your machine.
2. **Prisma**: You must have the Prisma CLI available in your project directory (`npx prisma`).
3. **Target Database**: You must have a clean, recently migrated target database.

### Step 1: Prepare the Target Database
Ensure your `.env` file points to the new/restored PostgreSQL database.

```bash
# Apply schemas
npx prisma migrate deploy
```

### Step 2: Create a Restore Script
Create a new file in the root of your project called `restore.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const db = new PrismaClient();

async function runRestore() {
    console.log("Starting restore process...");
    
    // 1. Read your backup file
    const backupFile = fs.readFileSync('path/to/your-downloaded-backup.json', 'utf8');
    const backup = JSON.parse(backupFile);
    
    const { orders, customers, products } = backup.data;

    // 2. Wrap in a transaction to ensure all-or-nothing restoration
    await db.$transaction(async (tx) => {
        
        // Restore Customers
        console.log(`Restoring ${customers.length} customers...`);
        for (const customer of customers) {
            await tx.customer.create({ data: customer });
        }

        // Restore Products
        console.log(`Restoring ${products.length} products...`);
        for (const product of products) {
            await tx.product.create({ data: product });
        }

        // Restore Orders & Order Items
        console.log(`Restoring ${orders.length} orders...`);
        for (const order of orders) {
            const items = order.items;
            delete order.items; // Remove nested items before creating order
            
            await tx.order.create({
                data: {
                    ...order,
                    items: {
                        create: items
                    }
                }
            });
        }
    });

    console.log("Restore complete!");
}

runRestore().catch(console.error).finally(() => db.$disconnect());
```

### Step 3: Execute the Restore Script
Run the script using node:
```bash
node restore.js
```

### Important Notes
- **Do not** run the restore script on a database that already has data, as ID collisions will cause the process to fail. Always restore to a clean database.
- **Passwords**: The JSON backup does **not** include the `User` table (Staff passwords) for security reasons. You will need to recreate staff accounts using the seed script `npx tsx prisma/seed.ts` or manually.
