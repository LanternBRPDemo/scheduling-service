require('dotenv').config();
const knex = require('knex');

async function createSchema() {
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

  try {
    await db.raw('CREATE SCHEMA IF NOT EXISTS scheduling_service');
    console.log('✅ Schema created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

createSchema();