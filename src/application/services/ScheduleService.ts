import { ScheduleRepository } from '../../infrastructure/repositories/ScheduleRepository';
import { TeamRepository } from '../../infrastructure/repositories/TeamRepository';
import { ScheduleAssignment, ScheduleView } from '../../domain/entities/Schedule';
import { Knex } from 'knex';

export class ScheduleService {
  private scheduleRepo: ScheduleRepository;
  private teamRepo: TeamRepository;

  constructor(db: Knex) {
    this.scheduleRepo = new ScheduleRepository(db);
    this.teamRepo = new TeamRepository(db);
  }

  async getDaySchedule(tenantId: string, date: string): Promise<{
    schedules: ScheduleView[];
    teams: any[];
    summary: {
      totalJobs: number;
      completedJobs: number;
      inProgressJobs: number;
      scheduledJobs: number;
      totalOperators: number;
    };
  }> {
    const targetDate = new Date(date);
    const schedules = await this.scheduleRepo.getSchedulesByDay(tenantId, targetDate);
    const teams = await this.teamRepo.getTeamsWithMembers(tenantId);

    const summary = {
      totalJobs: schedules.length,
      completedJobs: schedules.filter(s => s.status === 'completed').length,
      inProgressJobs: schedules.filter(s => s.status === 'in_progress').length,
      scheduledJobs: schedules.filter(s => s.status === 'scheduled').length,
      totalOperators: new Set(schedules.map(s => s.operator_id)).size,
    };

    return {
      schedules,
      teams,
      summary,
    };
  }

  async getWeekSchedule(tenantId: string, weekStart: string): Promise<{
    schedules: ScheduleView[];
    teams: any[];
    weekDays: string[];
    summary: {
      totalJobs: number;
      completedJobs: number;
      inProgressJobs: number;
      scheduledJobs: number;
      totalOperators: number;
    };
  }> {
    const startDate = new Date(weekStart);
    // Ensure we start from Monday
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    const schedules = await this.scheduleRepo.getSchedulesByWeek(tenantId, startDate);
    const teams = await this.teamRepo.getTeamsWithMembers(tenantId);

    // Generate week days
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      weekDays.push(day.toISOString().split('T')[0]);
    }

    const summary = {
      totalJobs: schedules.length,
      completedJobs: schedules.filter(s => s.status === 'completed').length,
      inProgressJobs: schedules.filter(s => s.status === 'in_progress').length,
      scheduledJobs: schedules.filter(s => s.status === 'scheduled').length,
      totalOperators: new Set(schedules.map(s => s.operator_id)).size,
    };

    return {
      schedules,
      teams,
      weekDays,
      summary,
    };
  }

  async getMonthSchedule(tenantId: string, year: number, month: number): Promise<{
    schedules: ScheduleView[];
    teams: any[];
    calendar: {
      year: number;
      month: number;
      monthName: string;
      daysInMonth: number;
      firstDayOfWeek: number;
    };
    summary: {
      totalJobs: number;
      completedJobs: number;
      inProgressJobs: number;
      scheduledJobs: number;
      totalOperators: number;
    };
  }> {
    const schedules = await this.scheduleRepo.getSchedulesByMonth(tenantId, year, month);
    const teams = await this.teamRepo.getTeamsWithMembers(tenantId);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const calendar = {
      year,
      month,
      monthName: monthNames[month - 1],
      daysInMonth: lastDay.getDate(),
      firstDayOfWeek: firstDay.getDay(),
    };

    const summary = {
      totalJobs: schedules.length,
      completedJobs: schedules.filter(s => s.status === 'completed').length,
      inProgressJobs: schedules.filter(s => s.status === 'in_progress').length,
      scheduledJobs: schedules.filter(s => s.status === 'scheduled').length,
      totalOperators: new Set(schedules.map(s => s.operator_id)).size,
    };

    return {
      schedules,
      teams,
      calendar,
      summary,
    };
  }

  async assignOperatorToJob(
    tenantId: string,
    appointmentId: string,
    operatorId: string,
    teamId?: string,
    scheduledStart?: Date,
    scheduledEnd?: Date,
    createdBy?: string
  ): Promise<ScheduleAssignment> {
    const assignment: Partial<ScheduleAssignment> = {
      tenant_id: tenantId,
      appointment_id: appointmentId,
      operator_id: operatorId,
      team_id: teamId,
      scheduled_start: scheduledStart || new Date(),
      scheduled_end: scheduledEnd || new Date(),
      status: 'scheduled',
      created_by: createdBy || operatorId,
    };

    return await this.scheduleRepo.createAssignment(assignment);
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    updatedBy?: string
  ): Promise<ScheduleAssignment> {
    const updates: Partial<ScheduleAssignment> = {
      status,
      updated_by: updatedBy,
    };

    if (status === 'in_progress') {
      updates.actual_start = new Date();
    } else if (status === 'completed') {
      updates.actual_end = new Date();
    }

    return await this.scheduleRepo.updateAssignment(assignmentId, updates);
  }

  async getOperatorSchedule(
    operatorId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduleView[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await this.scheduleRepo.getOperatorSchedule(operatorId, start, end);
  }
}