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

async function checkSchema() {
  try {
    // Check columns in appointments table
    const columns = await db.raw(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'manufacturing_service'
        AND table_name = 'appointments'
      ORDER BY ordinal_position
    `);

    console.log('Appointments table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Get a sample appointment with employee assignment
    const sample = await db.raw(`
      SELECT *
      FROM manufacturing_service.appointments
      WHERE metadata->>'assigned_employee_id' IS NOT NULL
      LIMIT 1
    `);

    if (sample.rows.length > 0) {
      console.log('\nSample appointment:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

checkSchema();