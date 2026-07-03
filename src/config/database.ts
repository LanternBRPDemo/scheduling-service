import knex, { Knex } from 'knex';
import { Config } from '../shared/types';

export function createDatabaseConnection(config: Config): Knex {
  return knex({
    client: 'postgresql',
    connection: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    },
    searchPath: [config.database.schema || 'scheduling_service', 'public'],
    pool: {
      min: 2,
      max: 10,
    },
  });
}

export const db = createDatabaseConnection({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    name: process.env.DB_NAME || 'lantern_erp',
    user: process.env.DB_USER || 'lantern',
    password: process.env.DB_PASSWORD || 'lantern_dev_password',
    schema: process.env.DB_SCHEMA || 'scheduling_service',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
  },
  service: {
    name: process.env.SERVICE_NAME || 'scheduling-service',
    port: parseInt(process.env.SERVICE_PORT || '4010'),
  },
  environment: process.env.NODE_ENV || 'development',
});