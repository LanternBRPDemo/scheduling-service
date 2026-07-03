import { Router } from 'express';
import { gatewayAuthMiddleware, tenantMiddleware } from '../shared/middleware';
import { ScheduleController } from './controllers/ScheduleController';
import { TeamController } from './controllers/TeamController';
import { TeamsUpdateController } from './controllers/teams-update.controller';
import { ScheduleService } from '../application/services/ScheduleService';
import { Knex } from 'knex';

export function createRoutes(db: Knex): Router {
  const router = Router();

  // Health check routes (no auth required - must be first!)
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'scheduling-service',
      timestamp: new Date().toISOString()
    });
  });

  // Initialize services and controllers
  const scheduleService = new ScheduleService(db);
  const scheduleController = new ScheduleController(scheduleService);
  const teamController = new TeamController(db);
  const teamsUpdateController = new TeamsUpdateController();

  // Apply Gateway authentication middleware
  router.use(gatewayAuthMiddleware());

  // Apply tenant middleware for protected routes
  router.use('/api', tenantMiddleware);

  // Schedule routes
  router.get('/api/schedules/day', scheduleController.getDaySchedule);
  router.get('/api/schedules/week', scheduleController.getWeekSchedule);
  router.get('/api/schedules/month', scheduleController.getMonthSchedule);
  router.post('/api/schedules/assignments', scheduleController.assignOperator);
  router.put('/api/schedules/assignments/:id', scheduleController.updateAssignmentStatus);
  router.get('/api/operators/:operatorId/schedule', scheduleController.getOperatorSchedule);

  // Team routes
  router.get('/api/teams', teamController.getAllTeams);
  router.get('/api/teams/:id', teamController.getTeamById);
  router.post('/api/teams', teamController.createTeam);
  router.put('/api/teams/:id', teamController.updateTeam);
  router.delete('/api/teams/:id', teamController.deleteTeam);
  router.post('/api/teams/:id/members', teamController.addTeamMember);
  router.delete('/api/teams/:id/members/:operatorId', teamController.removeTeamMember);

  // Admin route to update BlueDrop teams with real employee data
  router.post('/api/teams/update-bluedrop', teamsUpdateController.updateBluedropTeams);

  return router;
}