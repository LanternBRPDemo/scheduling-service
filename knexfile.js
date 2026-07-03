require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5434'),
      database: process.env.DB_NAME || 'lantern_erp',
      user: process.env.DB_USER || 'lantern',
      password: process.env.DB_PASSWORD || 'lantern_dev_password'
    },
    migrations: {
      directory: './src/infrastructure/database/migrations',
      tableName: 'knex_migrations',
      schemaName: process.env.DB_SCHEMA || 'scheduling_service'
    },
    seeds: {
      directory: './src/infrastructure/database/seeds'
    },
    searchPath: [process.env.DB_SCHEMA || 'scheduling_service', 'public']
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    migrations: {
      directory: './dist/infrastructure/database/migrations',
      schemaName: process.env.DB_SCHEMA || 'scheduling_service'
    },
    searchPath: [process.env.DB_SCHEMA || 'scheduling_service', 'public']
  }
};