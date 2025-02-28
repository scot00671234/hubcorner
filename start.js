
const { spawn } = require('child_process');
const path = require('path');

// Start the Vite development server
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start the backend server
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  frontend.kill('SIGINT');
  backend.kill('SIGINT');
  process.exit(0);
});

console.log('📱 Frontend and 🖥️ Backend servers started!');
console.log('📊 SQLite database initialized at ./lynxier.db');
console.log('🚀 Your Lynxier app is running!');
