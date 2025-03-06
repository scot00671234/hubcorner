
# Deploying to CloudPanel VPS

This guide provides step-by-step instructions for deploying Lynxier on CloudPanel VPS.

## Prerequisites

- Access to CloudPanel (already set up at lynxier.run.place)
- SSH access to your server as the site user (run-lynxier)
- Git installed on the server

## Deployment Steps

1. **SSH into your CloudPanel server**

   ```
   ssh run-lynxier@147.93.87.98
   ```

   When prompted, enter your password: `Puy65kud+Puy65kud+`

2. **Navigate to your site's directory**

   ```
   cd ~/htdocs/lynxier
   ```

3. **Clone your repository**

   ```
   git clone https://github.com/your-username/your-repo.git .
   ```

   Note: If the directory isn't empty, you may need to initialize git and pull:
   ```
   git init
   git remote add origin https://github.com/your-username/your-repo.git
   git fetch
   git checkout main  # or master
   ```

4. **Make the deployment script executable**

   ```
   chmod +x cloudpanel-deploy.sh
   ```

5. **Run the deployment script**

   ```
   ./cloudpanel-deploy.sh
   ```

6. **Configure Nginx in CloudPanel**

   - Log into CloudPanel admin panel
   - Go to Sites > lynxier.run.place > Vhost
   - Select the "Custom" section
   - Click "Import" and upload the nginx.conf file from your home directory
   - Click "Save"

7. **Verify the application is running**

   Open your browser and navigate to https://lynxier.run.place

## Troubleshooting

- **Application not starting**: Check PM2 logs with `pm2 logs lynxier`
- **Database errors**: Ensure the data directory has proper permissions with `chmod 755 -R ~/data`
- **Nginx errors**: Check CloudPanel logs at Sites > lynxier.run.place > Logs

## Maintenance

- **Update your application**:
  ```
  cd ~/htdocs/lynxier
  git pull
  ./cloudpanel-deploy.sh
  ```

- **View application logs**:
  ```
  pm2 logs lynxier
  ```

- **Restart the application**:
  ```
  pm2 restart lynxier
  ```
