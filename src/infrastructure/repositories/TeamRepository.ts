import { Knex } from 'knex';
import { Team, TeamMember } from '../../domain/entities/Team';
import { v4 as uuidv4 } from 'uuid';

export class TeamRepository {
  constructor(private db: Knex) {}

  private get schema() {
    return process.env.DB_SCHEMA || 'scheduling_service';
  }

  async findAll(tenantId: string): Promise<Team[]> {
    return this.db(`${this.schema}.teams`)
      .where({ tenant_id: tenantId })
      .orderBy('name', 'asc');
  }

  async findById(id: string): Promise<Team | null> {
    const team = await this.db(`${this.schema}.teams`)
      .where({ id })
      .first();
    return team || null;
  }

  async create(team: Partial<Team>): Promise<Team> {
    const [created] = await this.db(`${this.schema}.teams`)
      .insert({
        ...team,
        id: team.id || uuidv4(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return created;
  }

  async update(id: string, updates: Partial<Team>): Promise<Team> {
    const [updated] = await this.db(`${this.schema}.teams`)
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db(`${this.schema}.teams`)
      .where({ id })
      .delete();
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.db(`${this.schema}.team_members as tm`)
      .leftJoin('user_service.employees as e', 'tm.operator_id', 'e.id')
      .select(
        'tm.*',
        this.db.raw(`COALESCE(e.first_name || ' ' || e.last_name, 'Unknown') as operator_name`),
        'e.first_name',
        'e.last_name'
      )
      .where({ 'tm.team_id': teamId })
      .orderBy('tm.joined_at', 'asc');
  }

  async addTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
    const [created] = await this.db(`${this.schema}.team_members`)
      .insert({
        ...member,
        id: member.id || uuidv4(),
        joined_at: member.joined_at || new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return created;
  }

  async removeTeamMember(teamId: string, operatorId: string): Promise<void> {
    await this.db(`${this.schema}.team_members`)
      .where({ team_id: teamId, operator_id: operatorId })
      .delete();
  }

  async getTeamsWithMembers(tenantId: string): Promise<any[]> {
    const result = await this.db.raw(`
      SELECT
        t.*,
        json_agg(
          json_build_object(
            'id', tm.id,
            'operator_id', tm.operator_id,
            'operator_name', COALESCE(e.first_name || ' ' || e.last_name, 'Unknown'),
            'first_name', e.first_name,
            'last_name', e.last_name,
            'role', tm.role,
            'joined_at', tm.joined_at
          ) ORDER BY tm.joined_at
        ) FILTER (WHERE tm.id IS NOT NULL) as members
      FROM ${this.schema}.teams t
      LEFT JOIN ${this.schema}.team_members tm ON t.id = tm.team_id
      LEFT JOIN user_service.employees e ON tm.operator_id = e.id
      WHERE t.tenant_id = ?
      GROUP BY t.id
      ORDER BY t.name
    `, [tenantId]);

    return result.rows;
  }
}