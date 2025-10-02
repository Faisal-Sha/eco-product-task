const http = require('http');

const options = {
  host: '0.0.0.0',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (response) => {
  console.log(`Health check status: ${response.statusCode}`);
  if (response.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});

request.end();
