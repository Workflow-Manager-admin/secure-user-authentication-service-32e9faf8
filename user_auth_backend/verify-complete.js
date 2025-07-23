const http = require('http');

console.log('🚀 Starting comprehensive authentication service verification...\n');

// Test configuration
const BASE_URL = 'http://localhost';
const PORT = process.env.PORT || 3000;
const API_BASE = `${BASE_URL}:${PORT}`;

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123456',
  name: 'Test User'
};

let authToken = '';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body: jsonBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('1️⃣ Testing health endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.status === 'ok') {
      console.log('   ✅ Health endpoint working correctly');
      console.log(`   📊 Response: ${JSON.stringify(response.body)}\n`);
      return true;
    } else {
      console.log(`   ❌ Health endpoint failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health endpoint error: ${error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  console.log('2️⃣ Testing user registration...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, testUser);
    
    if (response.statusCode === 201 && response.body.status === 'success') {
      authToken = response.body.data.token;
      console.log('   ✅ User registration successful');
      console.log(`   👤 User: ${response.body.data.user.email}`);
      console.log(`   🔑 Token received: ${authToken.substring(0, 20)}...\n`);
      return true;
    } else {
      console.log(`   ❌ User registration failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Registration error: ${error.message}`);
    return false;
  }
}

async function testUserLogin() {
  console.log('3️⃣ Testing user login...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const loginData = {
    email: testUser.email,
    password: testUser.password
  };

  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 && response.body.status === 'success') {
      authToken = response.body.data.token;
      console.log('   ✅ User login successful');
      console.log(`   👤 User: ${response.body.data.user.email}`);
      console.log(`   🔑 New token: ${authToken.substring(0, 20)}...\n`);
      return true;
    } else {
      console.log(`   ❌ User login failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Login error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  console.log('4️⃣ Testing get user profile...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.status === 'success') {
      console.log('   ✅ Profile retrieval successful');
      console.log(`   👤 Profile: ${JSON.stringify(response.body.data.user)}\n`);
      return true;
    } else {
      console.log(`   ❌ Profile retrieval failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Profile error: ${error.message}`);
    return false;
  }
}

async function testLogout() {
  console.log('5️⃣ Testing user logout...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/auth/logout',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.status === 'success') {
      console.log('   ✅ User logout successful');
      console.log(`   📄 Message: ${response.body.message}\n`);
      return true;
    } else {
      console.log(`   ❌ User logout failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Logout error: ${error.message}`);
    return false;
  }
}

// Main verification function
async function runVerification() {
  const results = [];
  
  results.push(await testHealthEndpoint());
  results.push(await testUserRegistration());
  results.push(await testUserLogin());
  results.push(await testGetProfile());
  results.push(await testLogout());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 VERIFICATION RESULTS:');
  console.log('=' .repeat(50));
  console.log(`✅ Tests passed: ${passed}/${total}`);
  console.log(`❌ Tests failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication service is working correctly.');
    console.log('🔗 API Documentation: http://localhost:3000/docs');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server logs.');
  }
  
  return passed === total;
}

// Start server and run tests
const app = require('./src/app');

const server = app.listen(PORT, 'localhost', async () => {
  console.log(`🔧 Test server started on ${API_BASE}\n`);
  
  // Wait a bit for server to be ready
  setTimeout(async () => {
    const success = await runVerification();
    
    server.close(() => {
      console.log('\n🔌 Test server stopped');
      process.exit(success ? 0 : 1);
    });
  }, 1000);
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});
