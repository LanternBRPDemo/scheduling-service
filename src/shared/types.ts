export interface Config {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    schema?: string;
  };
  redis: {
    host: string;
    port: number;
  };
  service: {
    name: string;
    port: number;
  };
  environment: string;
}