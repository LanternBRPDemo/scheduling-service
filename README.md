# Scheduling Service

A microservice for managing appointment scheduling and team assignments in the LanternBRP platform.

## Features

- **Schedule Views**: Day, Week, and Month schedule management
- **Team Management**: Create and manage service teams with operators
- **Operator Management**: Track operator assignments and availability
- **Manufacturing Integration**: Integrates with manufacturing_service appointments and work orders
- **Multi-tenant Support**: Full tenant isolation with BlueDrop Water as default tenant

## Architecture

Built with:
- Node.js + TypeScript
- PostgreSQL (shared with other services)
- Redis (shared for caching)
- Express.js REST API
- Knex.js for database migrations and queries

## Database Schema

The service uses the `scheduling_service` schema with the following tables:
- `teams`: Service teams with metadata
- `team_members`: Operator-team associations
- `schedule_assignments`: Appointment-operator assignments
- `schedule_blocks`: Recurring schedule patterns
- `operator_availability`: Operator availability tracking

## API Endpoints

### Schedules
- `GET /api/schedules/day?date=YYYY-MM-DD` - Get day view schedules
- `GET /api/schedules/week?date=YYYY-MM-DD` - Get week view schedules (starting Monday)
- `GET /api/schedules/month?year=YYYY&month=MM` - Get month view schedules

### Teams
- `GET /api/teams` - List all teams with members
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:id` - Update team details
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:memberId` - Remove team member

### Assignments
- `POST /api/schedules/assignments` - Create schedule assignment
- `PUT /api/schedules/assignments/:id` - Update assignment

### Operators
- `GET /api/operators/:id/schedule` - Get operator's schedule

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lantern_erp
DB_USER=lantern
DB_PASSWORD=lantern_dev_password
DB_SCHEMA=scheduling_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service
SERVICE_NAME=scheduling-service
SERVICE_PORT=4015
NODE_ENV=development
```

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL running on port 5432
- Redis running on port 6379

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run migrate
```

3. Start development server:
```bash
npm run dev
```

### Building

```bash
npm run build
```

### Production

```bash
npm start
```

## Integration with Manufacturing Service

The scheduling service reads appointment data from `manufacturing_service.appointments` and `manufacturing_service.work_orders` tables. It filters appointments based on:
- `metadata->>'schedule_balance_batch' = 'bluedrop_july_2026_weekday_even_distribution_v1'`
- `metadata->>'calendar_ready' = 'true'`

Operator assignments are extracted from appointment metadata fields:
- `primary_employee_id/name`
- `additional_employee_ids/names`
- `crew_employee_ids/names`

## Testing

The service includes integration with the frontend scheduling views (Day, Week, Month) that support both mock data and live API data through a toggle switch.

## License

Private - LanternBRP