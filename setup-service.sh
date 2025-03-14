
#!/bin/bash

# Hub Corner service setup script
# Make this file executable with: chmod +x setup-service.sh

echo "Setting up Hub Corner as a systemd service..."

# Create a dedicated user for security reasons if it doesn't exist
if ! id -u hubcorner > /dev/null 2>&1; then
  echo "Creating hubcorner user..."
  sudo useradd -r -s /bin/false hubcorner
fi

# Create application directory
sudo mkdir -p /opt/hubcorner
sudo mkdir -p /opt/hubcorner/data

# Copy the built Go binary to the application directory
sudo cp ./hubcorner /opt/hubcorner/

# Ensure proper permissions
sudo chown -R hubcorner:hubcorner /opt/hubcorner
sudo chmod +x /opt/hubcorner/hubcorner

# Copy the service file to systemd directory
sudo cp hubcorner.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable hubcorner.service

# Start the service
sudo systemctl start hubcorner.service

# Check the service status
sudo systemctl status hubcorner.service

echo "Setup complete! Hub Corner service is now installed and running."
echo "You can check the logs with: sudo journalctl -u hubcorner.service"
