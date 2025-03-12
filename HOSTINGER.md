
# Deploying to Hostinger

This guide will help you deploy the Hub Corner application on Hostinger VPS.

## Prerequisites

- A Hostinger VPS account
- SSH access to your Hostinger VPS
- Basic knowledge of Linux commands

## Deployment Steps

1. **Connect to your Hostinger VPS via SSH**

   ```
   ssh username@your-server-ip
   ```

2. **Install Node.js and npm (if not already installed)**

   ```
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Git**

   ```
   sudo apt-get install git
   ```

4. **Clone your repository**

   ```
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

5. **Install dependencies and build the application**

   ```
   npm install
   npm run build
   ```

6. **Set up environment variables (optional)**

   ```
   export PORT=3001
   export DB_PATH=/path/to/hubcorner.db
   ```

7. **Start the application**

   ```
   npm start
   ```

8. **Set up a process manager (recommended)**

   Install PM2:
   ```
   npm install -g pm2
   ```

   Start your application with PM2:
   ```
   pm2 start start.js --name hubcorner
   ```

   Make PM2 start on server boot:
   ```
   pm2 startup
   pm2 save
   ```

9. **Set up Nginx as a reverse proxy (recommended)**

   Install Nginx:
   ```
   sudo apt-get install nginx
   ```

   Create a configuration file:
   ```
   sudo nano /etc/nginx/sites-available/hubcorner
   ```

   Add the following configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```
   sudo ln -s /etc/nginx/sites-available/hubcorner /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Set up SSL with Let's Encrypt (recommended)**

    ```
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com -d www.your-domain.com
    ```

## Troubleshooting

- If the application isn't accessible, check if the ports are open in your Hostinger VPS firewall settings.
- Check the logs with `pm2 logs hubcorner` to diagnose any issues.
- Ensure the database file is in a directory with proper write permissions.

## Maintenance

- To update your application, pull the latest changes and restart:
  ```
  git pull
  npm install
  npm run build
  pm2 restart hubcorner
  ```
