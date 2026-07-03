require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
});

async function checkTenants() {
  try {
    // Check for tenant IDs in appointments
    const result = await db.raw(`
      SELECT DISTINCT tenant_id
      FROM manufacturing_service.appointments
      WHERE tenant_id IS NOT NULL
      LIMIT 5
    `);

    console.log('Found tenant IDs:', result.rows);

    // Get a sample tenant ID that has appointments with employees
    const sampleTenant = await db.raw(`
      SELECT tenant_id, COUNT(*) as count
      FROM manufacturing_service.appointments
      WHERE tenant_id IS NOT NULL
        AND metadata->>'assigned_employee_id' IS NOT NULL
      GROUP BY tenant_id
      ORDER BY count DESC
      LIMIT 1
    `);

    if (sampleTenant.rows.length > 0) {
      console.log('Tenant with most assigned appointments:', sampleTenant.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

checkTenants();