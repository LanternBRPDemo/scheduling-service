import { Request, Response, NextFunction } from 'express';
import { TeamRepository } from '../../infrastructure/repositories/TeamRepository';
import { Knex } from 'knex';

export class TeamController {
  private teamRepo: TeamRepository;

  constructor(db: Knex) {
    this.teamRepo = new TeamRepository(db);
  }

  getAllTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const teams = await this.teamRepo.getTeamsWithMembers(tenantId);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  };

  getTeamById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const team = await this.teamRepo.findById(id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const members = await this.teamRepo.getTeamMembers(id);
      res.json({ ...team, members });
    } catch (error) {
      next(error);
    }
  };

  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, description, color, lead_operator_id } = req.body;

      const team = await this.teamRepo.create({
        tenant_id: tenantId,
        name,
        description,
        color: color || '#0066CC',
        lead_operator_id,
      });

      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  };

  updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, color, lead_operator_id } = req.body;

      const updated = await this.teamRepo.update(id, {
        name,
        description,
        color,
        lead_operator_id,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.teamRepo.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  addTeamMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: team_id } = req.params;
      const { operator_id, role } = req.body;

      const member = await this.teamRepo.addTeamMember({
        team_id,
        operator_id,
        role: role || 'member',
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  };

  removeTeamMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: team_id, operatorId } = req.params;
      await this.teamRepo.removeTeamMember(team_id, operatorId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}