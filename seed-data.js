require('dotenv').config();
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');

const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  searchPath: ['scheduling_service', 'public'],
});

async function seedData() {
  const schema = 'scheduling_service';
  const tenantId = '08534641-bbdd-477e-a14b-e4c675e979ac'; // BlueDrop tenant ID from database

  try {
    console.log('🌱 Starting seed data insertion...');

    // Clear existing data
    await db(`${schema}.team_members`).del();
    await db(`${schema}.teams`).del();
    await db(`${schema}.schedule_assignments`).del();

    // Create teams
    const teams = [
      {
        id: uuidv4(),
        tenant_id: tenantId,
        name: 'Assembly Team Alpha',
        description: 'Primary assembly line team',
        color: '#0066CC',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        name: 'Quality Control',
        description: 'Product inspection and quality assurance',
        color: '#28A745',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        name: 'Maintenance Crew',
        description: 'Equipment maintenance and repair',
        color: '#FFC107',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        name: 'Packaging Division',
        description: 'Product packaging and shipping preparation',
        color: '#DC3545',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await db(`${schema}.teams`).insert(teams);
    console.log(`✅ Inserted ${teams.length} teams`);

    // Create team members (using sample employee IDs)
    const teamMembers = [];
    const sampleEmployeeIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
      '550e8400-e29b-41d4-a716-446655440005',
      '550e8400-e29b-41d4-a716-446655440006',
      '550e8400-e29b-41d4-a716-446655440007',
      '550e8400-e29b-41d4-a716-446655440008',
    ];

    // Assign employees to teams
    teams.forEach((team, index) => {
      // Add 2 employees per team
      const startIdx = index * 2;
      teamMembers.push({
        id: uuidv4(),
        team_id: team.id,
        operator_id: sampleEmployeeIds[startIdx],
        role: 'lead',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
      teamMembers.push({
        id: uuidv4(),
        team_id: team.id,
        operator_id: sampleEmployeeIds[startIdx + 1],
        role: 'member',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    await db(`${schema}.team_members`).insert(teamMembers);
    console.log(`✅ Inserted ${teamMembers.length} team members`);

    // Create some sample schedule assignments for existing appointments
    // Let's query some appointments from manufacturing_service to create assignments
    const appointments = await db.raw(`
      SELECT id, scheduled_start, scheduled_end, metadata->>'assigned_employee_id' as employee_id
      FROM manufacturing_service.appointments
      WHERE tenant_id = ?
        AND scheduled_start IS NOT NULL
        AND metadata->>'assigned_employee_id' IS NOT NULL
      ORDER BY scheduled_start DESC
      LIMIT 20
    `, [tenantId]);

    if (appointments.rows.length > 0) {
      const scheduleAssignments = appointments.rows.map((apt, index) => ({
        id: uuidv4(),
        tenant_id: tenantId,
        appointment_id: apt.id,
        operator_id: apt.employee_id,
        team_id: teams[index % teams.length].id, // Distribute across teams
        scheduled_start: apt.scheduled_start,
        scheduled_end: apt.scheduled_end || new Date(new Date(apt.scheduled_start).getTime() + 2 * 60 * 60 * 1000), // Default 2 hours
        status: index < 5 ? 'completed' : index < 10 ? 'in_progress' : 'scheduled',
        created_by: apt.employee_id,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await db(`${schema}.schedule_assignments`).insert(scheduleAssignments);
      console.log(`✅ Inserted ${scheduleAssignments.length} schedule assignments`);
    }

    console.log('🎉 Seed data insertion completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seedData();