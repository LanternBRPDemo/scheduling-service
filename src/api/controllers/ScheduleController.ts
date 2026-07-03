import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../../application/services/ScheduleService';

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  getDaySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];

      const result = await this.scheduleService.getDaySchedule(tenantId, date);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getWeekSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const start = req.query.start as string || new Date().toISOString().split('T')[0];

      const result = await this.scheduleService.getWeekSchedule(tenantId, start);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getMonthSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      const result = await this.scheduleService.getMonthSchedule(tenantId, year, month);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  assignOperator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const {
        appointment_id,
        operator_id,
        team_id,
        scheduled_start,
        scheduled_end,
      } = req.body;

      const assignment = await this.scheduleService.assignOperatorToJob(
        tenantId,
        appointment_id,
        operator_id,
        team_id,
        scheduled_start ? new Date(scheduled_start) : undefined,
        scheduled_end ? new Date(scheduled_end) : undefined,
        userId
      );

      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  };

  updateAssignmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { id } = req.params;
      const { status } = req.body;

      const updated = await this.scheduleService.updateAssignmentStatus(id, status, userId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  getOperatorSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { operatorId } = req.params;
      const startDate = req.query.start_date as string || new Date().toISOString().split('T')[0];
      const endDate = req.query.end_date as string || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const schedules = await this.scheduleService.getOperatorSchedule(
        operatorId,
        startDate,
        endDate
      );

      res.json(schedules);
    } catch (error) {
      next(error);
    }
  };
}