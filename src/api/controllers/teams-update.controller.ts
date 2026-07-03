import { Request, Response } from 'express';
import { Knex } from 'knex';
import { db } from '../../config/database';

const BLUEDROP_TENANT_ID = '08534641-bbdd-477e-a14b-e4c675e979ac';

export class TeamsUpdateController {
  updateBluedropTeams = async (req: Request, res: Response) => {
    try {
      console.log('Updating BlueDrop teams with real employee data...\n');

      // Get all BlueDrop employees with their teams
      const employees = await db('user_service.employees')
        .select('id', 'first_name', 'last_name', 'team', 'email')
        .where('tenant_id', BLUEDROP_TENANT_ID)
        .whereNotNull('team')
        .orderBy('team', 'asc')
        .orderBy('last_name', 'asc');

      // Group employees by team
      const teamGroups: Record<string, any[]> = {};
      employees.forEach((emp) => {
        if (!teamGroups[emp.team]) {
          teamGroups[emp.team] = [];
        }
        teamGroups[emp.team].push(emp);
      });

      // Clear existing teams and team_members for BlueDrop
      // First delete team members for BlueDrop teams
      await db('scheduling_service.team_members')
        .whereIn('team_id', function() {
          this.select('id').from('scheduling_service.teams').where('tenant_id', BLUEDROP_TENANT_ID);
        })
        .del();

      // Then delete the teams themselves
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

      const results = [];

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
        const members = [];
        for (const employee of employeesInTeam) {
          await db('scheduling_service.team_members')
            .insert({
              team_id: team.id,
              operator_id: employee.id,
              role: employee.id === leadEmployee.id ? 'lead' : 'member',
              joined_at: new Date(),
            });

          members.push({
            name: `${employee.first_name} ${employee.last_name}`,
            role: employee.id === leadEmployee.id ? 'lead' : 'member',
            id: employee.id,
          });

          console.log(
            `   - Added ${employee.first_name} ${employee.last_name} as ${
              employee.id === leadEmployee.id ? 'lead' : 'member'
            }`
          );
        }

        results.push({
          team: team.name,
          color: team.color,
          member_count: members.length,
          members,
        });
      }

      console.log('\n✅ Teams updated successfully!');

      res.json({
        success: true,
        message: 'BlueDrop teams updated successfully',
        teams: results,
        summary: {
          total_teams: results.length,
          total_members: results.reduce((sum, team) => sum + team.member_count, 0),
        },
      });
    } catch (error: any) {
      console.error('Error updating teams:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}