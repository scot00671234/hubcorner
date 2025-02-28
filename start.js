
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('⚠️ "dist" directory not found. Make sure to build the app first with "npm run build"');
  process.exit(1);
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
console.log('📊 SQLite database initialized at ./lynxier.db');
console.log('🚀 Your Lynxier app is running!');
console.log('Open your browser to http://localhost:3001 to access the application');
