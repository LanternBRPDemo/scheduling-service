import { Knex } from 'knex';
import { ScheduleAssignment, ScheduleView } from '../../domain/entities/Schedule';
import { v4 as uuidv4 } from 'uuid';

export class ScheduleRepository {
  constructor(private db: Knex) {}

  private get schema() {
    return process.env.DB_SCHEMA || 'scheduling_service';
  }

  async getSchedulesByDay(tenantId: string, date: Date): Promise<ScheduleView[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const schedules = await this.db.raw(`
      SELECT
        a.id as appointment_id,
        a.work_order_id,
        wo.work_order_number,
        COALESCE(wo.customer_name, a.metadata->>'customer_full_name', a.assigned_to, 'Unknown Customer') as customer_name,
        COALESCE(wo.description, a.metadata->>'description', a.metadata->>'work_order_description', a.appointment_type) as job_description,
        a.metadata->>'service_team' as service_team,
        a.metadata->>'primary_employee_id' as operator_id,
        a.metadata->>'primary_employee_name' as operator_name,
        a.metadata->'additional_employee_ids' as additional_employee_ids,
        a.metadata->'additional_employee_names' as additional_employee_names,
        a.metadata->'crew_employee_ids' as crew_employee_ids,
        a.metadata->'crew_employee_names' as crew_employee_names,
        COALESCE(sa.team_id, t2.id) as team_id,
        COALESCE(t.name, t2.name, a.metadata->>'service_team') as team_name,
        COALESCE(t.color, t2.color, '#94a3b8') as team_color,
        a.scheduled_start,
        a.scheduled_end,
        a.status,
        CASE
          WHEN a.metadata->>'priority' IS NOT NULL THEN LOWER(a.metadata->>'priority')
          ELSE 'medium'
        END as priority
      FROM manufacturing_service.appointments a
      LEFT JOIN manufacturing_service.work_orders wo
        ON wo.tenant_id = a.tenant_id
        AND wo.id = a.work_order_id
      LEFT JOIN ${this.schema}.schedule_assignments sa
        ON a.id = sa.appointment_id AND sa.tenant_id = ?
      LEFT JOIN ${this.schema}.teams t
        ON sa.team_id = t.id
      LEFT JOIN ${this.schema}.teams t2
        ON t2.tenant_id = a.tenant_id
        AND t2.name = a.metadata->>'service_team'
      WHERE a.tenant_id = ?
        AND a.scheduled_start BETWEEN ? AND ?
        AND a.metadata->>'schedule_balance_batch' = 'bluedrop_july_2026_weekday_even_distribution_v1'
        AND a.metadata->>'calendar_ready' = 'true'
      ORDER BY a.scheduled_start, a.metadata->>'service_team', a.metadata->>'primary_employee_name'
    `, [tenantId, tenantId, startOfDay, endOfDay]);

    return schedules.rows;
  }

  async getSchedulesByWeek(tenantId: string, weekStart: Date): Promise<ScheduleView[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const schedules = await this.db.raw(`
      SELECT
        a.id as appointment_id,
        a.work_order_id,
        wo.work_order_number,
        COALESCE(wo.customer_name, a.metadata->>'customer_full_name', a.assigned_to, 'Unknown Customer') as customer_name,
        COALESCE(wo.description, a.metadata->>'description', a.metadata->>'work_order_description', a.appointment_type) as job_description,
        a.metadata->>'service_team' as service_team,
        a.metadata->>'primary_employee_id' as operator_id,
        a.metadata->>'primary_employee_name' as operator_name,
        a.metadata->'additional_employee_ids' as additional_employee_ids,
        a.metadata->'additional_employee_names' as additional_employee_names,
        a.metadata->'crew_employee_ids' as crew_employee_ids,
        a.metadata->'crew_employee_names' as crew_employee_names,
        COALESCE(sa.team_id, t2.id) as team_id,
        COALESCE(t.name, t2.name, a.metadata->>'service_team') as team_name,
        COALESCE(t.color, t2.color, '#94a3b8') as team_color,
        a.scheduled_start,
        a.scheduled_end,
        a.status,
        CASE
          WHEN a.metadata->>'priority' IS NOT NULL THEN LOWER(a.metadata->>'priority')
          ELSE 'medium'
        END as priority
      FROM manufacturing_service.appointments a
      LEFT JOIN manufacturing_service.work_orders wo
        ON wo.tenant_id = a.tenant_id
        AND wo.id = a.work_order_id
      LEFT JOIN ${this.schema}.schedule_assignments sa
        ON a.id = sa.appointment_id AND sa.tenant_id = ?
      LEFT JOIN ${this.schema}.teams t
        ON sa.team_id = t.id
      LEFT JOIN ${this.schema}.teams t2
        ON t2.tenant_id = a.tenant_id
        AND t2.name = a.metadata->>'service_team'
      WHERE a.tenant_id = ?
        AND a.scheduled_start BETWEEN ? AND ?
        AND a.metadata->>'schedule_balance_batch' = 'bluedrop_july_2026_weekday_even_distribution_v1'
        AND a.metadata->>'calendar_ready' = 'true'
      ORDER BY a.scheduled_start, a.metadata->>'service_team', a.metadata->>'primary_employee_name'
    `, [tenantId, tenantId, weekStart, weekEnd]);

    return schedules.rows;
  }

  async getSchedulesByMonth(tenantId: string, year: number, month: number): Promise<ScheduleView[]> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const schedules = await this.db.raw(`
      SELECT
        a.id as appointment_id,
        a.work_order_id,
        wo.work_order_number,
        COALESCE(wo.customer_name, a.metadata->>'customer_full_name', a.assigned_to, 'Unknown Customer') as customer_name,
        COALESCE(wo.description, a.metadata->>'description', a.metadata->>'work_order_description', a.appointment_type) as job_description,
        a.metadata->>'service_team' as service_team,
        a.metadata->>'primary_employee_id' as operator_id,
        a.metadata->>'primary_employee_name' as operator_name,
        a.metadata->'additional_employee_ids' as additional_employee_ids,
        a.metadata->'additional_employee_names' as additional_employee_names,
        a.metadata->'crew_employee_ids' as crew_employee_ids,
        a.metadata->'crew_employee_names' as crew_employee_names,
        COALESCE(sa.team_id, t2.id) as team_id,
        COALESCE(t.name, t2.name, a.metadata->>'service_team') as team_name,
        COALESCE(t.color, t2.color, '#94a3b8') as team_color,
        a.scheduled_start,
        a.scheduled_end,
        a.status,
        CASE
          WHEN a.metadata->>'priority' IS NOT NULL THEN LOWER(a.metadata->>'priority')
          ELSE 'medium'
        END as priority
      FROM manufacturing_service.appointments a
      LEFT JOIN manufacturing_service.work_orders wo
        ON wo.tenant_id = a.tenant_id
        AND wo.id = a.work_order_id
      LEFT JOIN ${this.schema}.schedule_assignments sa
        ON a.id = sa.appointment_id AND sa.tenant_id = ?
      LEFT JOIN ${this.schema}.teams t
        ON sa.team_id = t.id
      LEFT JOIN ${this.schema}.teams t2
        ON t2.tenant_id = a.tenant_id
        AND t2.name = a.metadata->>'service_team'
      WHERE a.tenant_id = ?
        AND a.scheduled_start BETWEEN ? AND ?
        AND a.metadata->>'schedule_balance_batch' = 'bluedrop_july_2026_weekday_even_distribution_v1'
        AND a.metadata->>'calendar_ready' = 'true'
      ORDER BY a.scheduled_start, a.metadata->>'service_team', a.metadata->>'primary_employee_name'
    `, [tenantId, tenantId, monthStart, monthEnd]);

    return schedules.rows;
  }

  async createAssignment(assignment: Partial<ScheduleAssignment>): Promise<ScheduleAssignment> {
    const [created] = await this.db(`${this.schema}.schedule_assignments`)
      .insert({
        ...assignment,
        id: assignment.id || uuidv4(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return created;
  }

  async updateAssignment(id: string, updates: Partial<ScheduleAssignment>): Promise<ScheduleAssignment> {
    const [updated] = await this.db(`${this.schema}.schedule_assignments`)
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  async getOperatorSchedule(operatorId: string, startDate: Date, endDate: Date): Promise<ScheduleView[]> {
    const schedules = await this.db.raw(`
      SELECT
        a.id as appointment_id,
        a.work_order_id,
        wo.work_order_number,
        COALESCE(wo.customer_name, a.metadata->>'customer_full_name', a.assigned_to, 'Unknown Customer') as customer_name,
        COALESCE(wo.description, a.metadata->>'description', a.metadata->>'work_order_description', a.appointment_type) as job_description,
        a.metadata->>'service_team' as service_team,
        a.metadata->>'primary_employee_id' as operator_id,
        a.metadata->>'primary_employee_name' as operator_name,
        a.metadata->'additional_employee_ids' as additional_employee_ids,
        a.metadata->'additional_employee_names' as additional_employee_names,
        a.metadata->'crew_employee_ids' as crew_employee_ids,
        a.metadata->'crew_employee_names' as crew_employee_names,
        COALESCE(sa.team_id, t2.id) as team_id,
        COALESCE(t.name, t2.name, a.metadata->>'service_team') as team_name,
        COALESCE(t.color, t2.color, '#94a3b8') as team_color,
        a.scheduled_start,
        a.scheduled_end,
        a.status,
        CASE
          WHEN a.metadata->>'priority' IS NOT NULL THEN LOWER(a.metadata->>'priority')
          ELSE 'medium'
        END as priority
      FROM manufacturing_service.appointments a
      LEFT JOIN manufacturing_service.work_orders wo
        ON wo.tenant_id = a.tenant_id
        AND wo.id = a.work_order_id
      LEFT JOIN ${this.schema}.schedule_assignments sa
        ON a.id = sa.appointment_id
      LEFT JOIN ${this.schema}.teams t
        ON sa.team_id = t.id
      LEFT JOIN ${this.schema}.teams t2
        ON t2.tenant_id = a.tenant_id
        AND t2.name = a.metadata->>'service_team'
      WHERE (
          a.metadata->>'primary_employee_id' = ? OR
          a.metadata->'additional_employee_ids' ? ? OR
          a.metadata->'crew_employee_ids' ? ?
        )
        AND a.scheduled_start BETWEEN ? AND ?
        AND a.metadata->>'schedule_balance_batch' = 'bluedrop_july_2026_weekday_even_distribution_v1'
        AND a.metadata->>'calendar_ready' = 'true'
      ORDER BY a.scheduled_start
    `, [operatorId, operatorId, operatorId, startDate, endDate]);

    return schedules.rows;
  }
}