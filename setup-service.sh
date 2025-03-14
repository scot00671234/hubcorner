
#!/bin/bash

# Hub Corner service setup script
# Make this file executable with: chmod +x setup-service.sh

echo "Setting up Hub Corner as a systemd service..."

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
