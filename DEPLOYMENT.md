# Scheduling Service Deployment Guide

## Railway Deployment

### Prerequisites
- Railway account and project
- PostgreSQL and Redis services deployed in Railway
- GitHub repository connected to Railway

### Environment Variables (Railway Dashboard)

Configure the following environment variables in your Railway service:

#### Database Configuration
```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SCHEMA=scheduling_service
```

#### Redis Configuration
```
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
```

#### Service Configuration
```
SERVICE_NAME=scheduling-service
SERVICE_PORT=4015
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

### Deployment Steps

1. **Connect Repository**
   - In Railway dashboard, create new service
   - Connect to GitHub repository: `LanternBRPDemo/scheduling-service`
   - Railway will auto-detect the Dockerfile

2. **Configure Service**
   - Service will use settings from `railway.json`
   - Health checks configured at `/health`
   - Auto-restart on failure (max 3 retries)

3. **Database Migration**
   - Run migrations manually after deployment:
     ```bash
     railway run npm run migrate
     ```
   - Or set up a Railway deployment hook to run migrations

4. **Verify Deployment**
   ```bash
   # Check service health
   curl https://scheduling-service.railway.app/health

   # Test API endpoint
   curl https://scheduling-service.railway.app/api/teams
   ```

## Docker Deployment

### Local Development with Docker Compose

1. **Build and Run**
   ```bash
   # Build the image
   docker-compose build

   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f scheduling-service
   ```

2. **Environment Variables**
   Create `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lantern_erp
   DB_USER=lantern
   DB_PASSWORD=lantern_dev_password
   DB_SCHEMA=scheduling_service
   REDIS_HOST=localhost
   REDIS_PORT=6379
   NODE_ENV=development
   ```

### Production Docker Deployment

1. **Build Production Image**
   ```bash
   docker build -t scheduling-service:latest .
   ```

2. **Run with External Database/Redis**
   ```bash
   docker run -d \
     --name scheduling-service \
     -p 4015:4015 \
     -e DB_HOST=your-db-host \
     -e DB_PORT=5432 \
     -e DB_NAME=lantern_erp \
     -e DB_USER=lantern \
     -e DB_PASSWORD=your-db-password \
     -e DB_SCHEMA=scheduling_service \
     -e REDIS_HOST=your-redis-host \
     -e REDIS_PORT=6379 \
     -e NODE_ENV=production \
     scheduling-service:latest
   ```

3. **Using Docker Compose in Production**
   ```bash
   # Use production override file
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Database Setup

### Initial Schema Creation

The service expects a PostgreSQL database with the `scheduling_service` schema.
Migrations will create this automatically, but ensure the database user has the necessary permissions:

```sql
-- Grant schema creation permission
GRANT CREATE ON DATABASE lantern_erp TO lantern;

-- After schema is created, grant usage
GRANT USAGE ON SCHEMA scheduling_service TO lantern;
GRANT ALL ON ALL TABLES IN SCHEMA scheduling_service TO lantern;
GRANT ALL ON ALL SEQUENCES IN SCHEMA scheduling_service TO lantern;
```

### Migration Commands

```bash
# Run migrations (local)
npm run migrate

# Create new migration
npm run migrate:make migration_name

# Rollback last migration
npx knex migrate:rollback
```

## Health Monitoring

### Health Check Endpoint
- **URL**: `/health`
- **Success Response**: 200 OK with JSON:
  ```json
  {
    "status": "healthy",
    "service": "scheduling-service",
    "timestamp": "2024-01-20T12:00:00Z",
    "checks": {
      "database": "connected",
      "redis": "connected"
    }
  }
  ```

### Monitoring in Railway
- Health checks run every 30 seconds
- Service auto-restarts after 3 consecutive failures
- Check Railway logs for detailed error information

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database host/port are accessible
   - Check credentials and permissions
   - Ensure `scheduling_service` schema exists or user can create it

2. **Redis Connection Failed**
   - Verify Redis host/port
   - Check if Redis requires authentication
   - Ensure Redis is running

3. **Migration Errors**
   - Check database permissions for schema creation
   - Verify all environment variables are set
   - Review migration logs for specific errors

4. **CORS Issues**
   - Update `CORS_ORIGIN` to match frontend URL
   - For multiple origins, modify cors configuration in code

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug NODE_ENV=development npm start
```

### Container Debugging

```bash
# Access container shell
docker exec -it scheduling-service sh

# Check environment variables
docker exec scheduling-service env

# View real-time logs
docker logs -f scheduling-service

# Check health status
docker exec scheduling-service curl http://localhost:4015/health
```

## Performance Tuning

### Database Optimization
- Ensure proper indexes on frequently queried columns
- Use connection pooling (configured in knexfile.js)
- Monitor query performance with `EXPLAIN ANALYZE`

### Redis Caching
- Cache frequently accessed data (teams, operators)
- Set appropriate TTL values
- Monitor Redis memory usage

### Docker Resource Limits

```yaml
# In docker-compose.yml
services:
  scheduling-service:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Railway's environment variable management
   - Rotate credentials regularly

2. **Network Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Configure firewall rules

3. **Database Security**
   - Use SSL connections in production
   - Implement row-level security if needed
   - Regular backups

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Support

For issues or questions:
- Check service logs in Railway dashboard
- Review error messages in `/health` endpoint
- Consult PostgreSQL and Redis connection logs