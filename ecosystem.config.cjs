module.exports = {
  apps: [
    {
      name: 'dandelion',
      script: 'serve.ts',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10_000,
      listen_timeout: 3000,
      env: {
        PORT: '3000',
        HOST: 'localhost',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/serve-error.log',
      out_file: 'logs/serve-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
