
#!/bin/bash

# CloudPanel deployment script for Lynxier
# Make this file executable with: chmod +x cloudpanel-deploy.sh

echo "Starting Lynxier deployment to CloudPanel..."

# Create data directory if it doesn't exist
mkdir -p /home/run-lynxier/data

# Install dependencies
npm ci

# Build the application
npm run build

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing PM2 process
pm2 stop lynxier 2>/dev/null || true
pm2 delete lynxier 2>/dev/null || true

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start start.js --name lynxier

# Save PM2 process list to start automatically on system restart
pm2 save

# Create or update the CloudPanel Nginx vhost configuration
cat > /home/run-lynxier/nginx.conf << EOF
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
}
EOF

echo "Deployment completed!"
echo "Please import the nginx.conf file in CloudPanel > Sites > lynxier.run.place > Vhost"
echo "Your application should be accessible at: https://lynxier.run.place"
