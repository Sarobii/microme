export default {
  apps: [{
    name: 'microme-dev',
    script: './node_modules/.bin/vite',
    args: '--host 0.0.0.0 --port 3000',
    cwd: '/home/user/webapp/microme',
    env: {
      NODE_ENV: 'development'
    },
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    merge_logs: true,
    time: true
  }]
};