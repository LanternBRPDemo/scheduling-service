const knex = require('knex');
require('dotenv').config({ path: '../.env' });

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '22282'),
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || 'AOKAeALRBCvCuoLGwzaWwbTYdRMHMxCS'),
    database: process.env.DB_NAME || 'railway',
  },
});

const BLUEDROP_TENANT_ID = '08534641-bbdd-477e-a14b-e4c675e979ac';

async function updateTeams() {
  try {
    console.log('Fetching BlueDrop employees with teams...\n');

    // Get all BlueDrop employees with their teams
    const employees = await db('user_service.employees')
      .select('id', 'first_name', 'last_name', 'team', 'email')
      .where('tenant_id', BLUEDROP_TENANT_ID)
      .whereNotNull('team')
      .orderBy('team', 'asc')
      .orderBy('last_name', 'asc');

    console.log('BlueDrop Employees by Team:\n');
    console.log('=============================\n');

    const teamGroups = {};
    employees.forEach(emp => {
      if (!teamGroups[emp.team]) {
        teamGroups[emp.team] = [];
      }
      teamGroups[emp.team].push(emp);
    });

    Object.keys(teamGroups).sort().forEach(team => {
      console.log(`\n${team} (${teamGroups[team].length} employees):`);
      console.log('-'.repeat(50));
      teamGroups[team].forEach(emp => {
        console.log(`  ${emp.first_name} ${emp.last_name} - ID: ${emp.id}`);
      });
    });

    // Now update scheduling_service teams
    console.log('\n\nUpdating scheduling_service teams...\n');

    // Clear existing teams and team_members for BlueDrop
    await db('scheduling_service.team_members')
      .where('tenant_id', BLUEDROP_TENANT_ID)
      .del();

    await db('scheduling_service.teams')
      .where('tenant_id', BLUEDROP_TENANT_ID)
      .del();

    // Create teams with proper colors
    const teamConfigs = [
      {
        name: 'Residential Service',
        description: 'Handles all residential service calls and installations',
        color: '#22c55e', // Green
      },
      {
        name: 'Commercial Service',
        description: 'Specializes in commercial and business installations',
        color: '#3b82f6', // Blue
      },
      {
        name: 'General Service',
        description: 'Handles general service calls and maintenance',
        color: '#f59e0b', // Amber
      },
    ];

    for (const teamConfig of teamConfigs) {
      const employeesInTeam = teamGroups[teamConfig.name] || [];

      if (employeesInTeam.length === 0) {
        console.log(`⚠️  No employees found for team: ${teamConfig.name}`);
        continue;
      }

      // Pick a lead (first person alphabetically)
      const leadEmployee = employeesInTeam[0];

      // Insert team
      const [team] = await db('scheduling_service.teams')
        .insert({
          tenant_id: BLUEDROP_TENANT_ID,
          name: teamConfig.name,
          description: teamConfig.description,
          color: teamConfig.color,
          lead_operator_id: leadEmployee.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      console.log(`✅ Created team: ${team.name} (${team.id})`);

      // Add team members
      for (const employee of employeesInTeam) {
        await db('scheduling_service.team_members')
          .insert({
            tenant_id: BLUEDROP_TENANT_ID,
            team_id: team.id,
            operator_id: employee.id,
            role: employee.id === leadEmployee.id ? 'lead' : 'member',
            joined_at: new Date(),
          });

        console.log(`   - Added ${employee.first_name} ${employee.last_name} as ${employee.id === leadEmployee.id ? 'lead' : 'member'}`);
      }
    }

    // Display final summary
    console.log('\n\n=== SUMMARY ===\n');

    const teams = await db('scheduling_service.teams')
      .where('tenant_id', BLUEDROP_TENANT_ID)
      .orderBy('name');

    for (const team of teams) {
      const members = await db('scheduling_service.team_members as tm')
        .join('user_service.employees as e', 'tm.operator_id', 'e.id')
        .select('e.first_name', 'e.last_name', 'tm.role')
        .where('tm.team_id', team.id)
        .orderBy('tm.role', 'desc')
        .orderBy('e.last_name');

      console.log(`\n${team.name} (Color: ${team.color}):`);
      members.forEach(member => {
        console.log(`  ${member.role === 'lead' ? '👑' : '👷'} ${member.first_name} ${member.last_name} (${member.role})`);
      });
    }

    console.log('\n✅ Teams updated successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

updateTeams();