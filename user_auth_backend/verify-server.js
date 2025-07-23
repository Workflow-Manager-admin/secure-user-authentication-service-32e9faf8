const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting server verification...');

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server successfully started at http://${HOST}:${PORT}`);
  console.log(`✅ API Documentation available at http://${HOST}:${PORT}/docs`);
  
  // Test health endpoint
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Health endpoint responded with status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Health response:', response);
        console.log('🎉 Server verification completed successfully!');
      } catch (e) {
        console.log('✅ Health endpoint responded (non-JSON):', data);
      }
      
      server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
      });
    });
  });

  req.on('error', (e) => {
    console.error('❌ Health check failed:', e.message);
    server.close(() => {
      process.exit(1);
    });
  });

  req.end();
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});
