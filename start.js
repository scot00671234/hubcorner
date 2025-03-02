
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./src/config');

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('⚠️ "dist" directory not found. Building the app first...');
  try {
    require('child_process').execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Function to start a process and handle its lifecycle
function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });
  
  proc.on('error', (error) => {
    console.error(`Error starting ${name}:`, error.message);
  });
  
  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${name} process exited with code ${code}`);
    }
  });
  
  return proc;
}

// Start the backend server
const backend = startProcess('node', ['server.js'], 'Backend server');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  backend.kill('SIGINT');
  process.exit(0);
});

console.log('🖥️ Backend server started!');
console.log(`📊 SQLite database initialized at ${config.DB_PATH}`);
console.log('🚀 Your Lynxier app is running!');
console.log(`Open your browser to http://localhost:${config.PORT} to access the application`);
