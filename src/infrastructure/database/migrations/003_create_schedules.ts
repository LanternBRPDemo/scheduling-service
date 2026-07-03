import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';

  // Create schedule_assignments table
  await knex.schema.withSchema(schema).createTable('schedule_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('appointment_id').notNullable(); // References manufacturing_service.appointments
    table.uuid('operator_id').notNullable(); // References user_service employee
    table.uuid('team_id').references('id').inTable(`${schema}.teams`).onDelete('SET NULL');
    table.timestamp('scheduled_start').notNullable();
    table.timestamp('scheduled_end').notNullable();
    table.timestamp('actual_start');
    table.timestamp('actual_end');
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
      .notNullable()
      .defaultTo('scheduled');
    table.text('notes');
    table.uuid('created_by').notNullable();
    table.uuid('updated_by');
    table.timestamps(true, true);

    // Indexes
    table.index(['tenant_id']);
    table.index(['appointment_id']);
    table.index(['operator_id']);
    table.index(['team_id']);
    table.index(['scheduled_start']);
    table.index(['scheduled_end']);
    table.index(['status']);
    table.unique(['appointment_id', 'operator_id']); // One operator per appointment
  });

  // Create operator_availability table
  await knex.schema.withSchema(schema).createTable('operator_availability', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('operator_id').notNullable(); // References user_service employee
    table.uuid('tenant_id').notNullable();
    table.date('date').notNullable();
    table.time('start_time').notNullable().defaultTo('09:00');
    table.time('end_time').notNullable().defaultTo('17:00');
    table.boolean('is_available').notNullable().defaultTo(true);
    table.string('reason', 255); // If not available
    table.timestamps(true, true);

    // Indexes
    table.index(['operator_id']);
    table.index(['tenant_id']);
    table.index(['date']);
    table.unique(['operator_id', 'date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'scheduling_service';

  await knex.schema.withSchema(schema).dropTableIfExists('operator_availability');
  await knex.schema.withSchema(schema).dropTableIfExists('schedule_assignments');
}