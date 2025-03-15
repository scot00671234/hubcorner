# HubCorner - Reddit-like Social Platform

HubCorner is a simple Reddit-like social media platform that allows users to create communities, posts, and comments without requiring user login. The application is built with Go, SQLite, HTML, CSS, and JavaScript.

## Features

- Create and browse communities
- Create posts within communities
- Comment on posts and reply to comments
- Upvote/downvote posts and comments
- Front page with posts from all communities
- No user login required (uses client identifiers for voting)

## Project Structure

```
/hubcorner
├── cmd/
│   └── main.go                 # Main application entry point
├── internal/
│   ├── database/
│   │   └── db.go               # Database operations
│   ├── models/
│   │   └── models.go           # Data models
│   └── handlers/
│       ├── handlers.go         # HTTP request handlers
│       └── helpers.go          # Helper functions for handlers
├── web/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css      # CSS styles
│   │   └── js/
│   │       └── main.js         # JavaScript for client-side interactions
│   └── templates/
│       ├── layout.html         # Base layout template
│       ├── index.html          # Front page template
│       ├── communities.html    # Communities list template
│       ├── community.html      # Single community view template
│       ├── new_community.html  # Create community form template
│       ├── new_post.html       # Create post form template
│       └── post.html           # Single post view template
└── README.md                   # This file
```

## Deployment Guide for Ubuntu Server

### Prerequisites

- Ubuntu Server (18.04 LTS or newer)
- Go 1.16 or newer
- Git (for cloning the repository)

### Step 1: Install Go

```bash
# Update package list
sudo apt update

# Install Go
sudo apt install -y golang-go

# Verify Go installation
go version
```

### Step 2: Clone the Repository

```bash
# Create a directory for the application
mkdir -p /var/www/hubcorner

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/yourusername/hubcorner.git /var/www/hubcorner

# Navigate to the project directory
cd /var/www/hubcorner
```

### Step 3: Install Dependencies

```bash
# Initialize Go module (if not already done)
go mod init hubcorner

# Install SQLite driver
go get github.com/mattn/go-sqlite3
```

### Step 4: Build the Application

```bash
# Build the application
go build -o hubcorner ./cmd/main.go
```

### Step 5: Set Up Systemd Service

Create a systemd service file to run the application as a service:

```bash
sudo nano /etc/systemd/system/hubcorner.service
```

Add the following content:

```
[Unit]
Description=HubCorner Reddit-like Platform
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/hubcorner
ExecStart=/var/www/hubcorner/hubcorner
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hubcorner

[Install]
WantedBy=multi-user.target
```

### Step 6: Start and Enable the Service

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Start the service
sudo systemctl start hubcorner

# Enable the service to start on boot
sudo systemctl enable hubcorner

# Check the status of the service
sudo systemctl status hubcorner
```

### Step 7: Set Up Nginx as a Reverse Proxy (Optional)

If you want to use Nginx as a reverse proxy to serve the application:

```bash
# Install Nginx
sudo apt install -y nginx

# Create a new Nginx configuration file
sudo nano /etc/nginx/sites-available/hubcorner
```

Add the following content:

```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/hubcorner /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Set Up Firewall (Optional)

If you're using UFW (Uncomplicated Firewall):

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow HTTPS traffic (if using SSL)
sudo ufw allow 443/tcp

# Enable the firewall if not already enabled
sudo ufw enable
```

## Usage

Once deployed, you can access the application at:

- http://yourdomain.com (if using Nginx)
- http://your-server-ip:8080 (if accessing directly)

## Maintenance

### Updating the Application

```bash
# Navigate to the project directory
cd /var/www/hubcorner

# Pull the latest changes
git pull

# Rebuild the application
go build -o hubcorner ./cmd/main.go

# Restart the service
sudo systemctl restart hubcorner
```

### Backing Up the Database

```bash
# Create a backup directory
mkdir -p /var/backups/hubcorner

# Copy the database file
cp /var/www/hubcorner/hubcorner.db /var/backups/hubcorner/hubcorner_$(date +%Y%m%d).db
```

## Troubleshooting

### Check Application Logs

```bash
# View application logs
sudo journalctl -u hubcorner
```

### Check Nginx Logs (if using Nginx)

```bash
# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
