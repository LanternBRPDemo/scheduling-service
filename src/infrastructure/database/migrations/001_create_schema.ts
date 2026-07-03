import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';

  // Create schema if it doesn't exist
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

  // Set search path
  await knex.raw(`SET search_path TO ${schema}`);
}

export async function down(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';
  await knex.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
}