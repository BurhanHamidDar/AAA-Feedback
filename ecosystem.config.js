module.exports = {
  apps: [
    {
      name: 'aaa-feedback-backend',
      script: 'dist/index.js',
      cwd: '/var/www/aaa-feedback/apps/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
