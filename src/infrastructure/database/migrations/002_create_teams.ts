import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';

  // Create teams table
  await knex.schema.withSchema(schema).createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('color', 7).notNullable().defaultTo('#0066CC'); // Hex color
    table.uuid('lead_operator_id');
    table.timestamps(true, true);

    // Indexes
    table.index(['tenant_id']);
    table.unique(['tenant_id', 'name']);
  });

  // Create team_members table
  await knex.schema.withSchema(schema).createTable('team_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable(`${schema}.teams`).onDelete('CASCADE');
    table.uuid('operator_id').notNullable(); // References user_service employee
    table.enum('role', ['lead', 'member']).notNullable().defaultTo('member');
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    // Indexes
    table.index(['team_id']);
    table.index(['operator_id']);
    table.unique(['team_id', 'operator_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';

  await knex.schema.withSchema(schema).dropTableIfExists('team_members');
  await knex.schema.withSchema(schema).dropTableIfExists('teams');
}