module.exports = {
  apps: [
    {
      name: 'aaa-feedback-backend',
      script: 'dist/index.js',
      cwd: '/var/www/aaa-feedback/apps/backend',

      // IMPORTANT: Must be 'fork', NOT 'cluster'.
      // whatsapp-web.js runs a single Puppeteer browser instance tied to a
      // LocalAuth session folder. Running multiple workers in cluster mode
      // would cause multiple browsers to fight over the same session, producing
      // "window['onQRChangedEvent'] already exists" and Puppeteer ProtocolErrors.
      exec_mode: 'fork',
      instances: 1,

      autorestart: true,
      watch: false,

      // Allow 5 seconds for Puppeteer to shut down cleanly before SIGKILL
      kill_timeout: 5000,

      // Wait 3 seconds before restarting after a crash to avoid rapid loops
      // that hammer Puppeteer re-initialization back-to-back
      restart_delay: 3000,

      max_memory_restart: '1G',

      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
