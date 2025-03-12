
package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	fmt.Println("Hub Corner Deployment Helper")
	fmt.Println("===========================")

	// Check if we're in the project root (where package.json exists)
	if _, err := os.Stat("package.json"); os.IsNotExist(err) {
		log.Fatal("Error: Must be run from project root directory (where package.json is located)")
	}

	// Create data directory if it doesn't exist
	dataDir := filepath.Join("/home/run-lynxier/data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Could not create data directory: %v", err)
	}

	steps := []struct {
		name    string
		command string
		args    []string
	}{
		{"Installing dependencies", "npm", []string{"ci"}},
		{"Building application", "npm", []string{"run", "build"}},
		{"Installing PM2 (if needed)", "npm", []string{"install", "-g", "pm2"}},
		{"Stopping existing PM2 process", "pm2", []string{"stop", "hubcorner"}},
		{"Removing existing PM2 process", "pm2", []string{"delete", "hubcorner"}},
		{"Starting application with PM2", "pm2", []string{"start", "start.js", "--name", "hubcorner"}},
		{"Saving PM2 process list", "pm2", []string{"save"}},
	}

	for _, step := range steps {
		fmt.Printf("\n➡️ %s...\n", step.name)
		cmd := exec.Command(step.command, step.args...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		
		if err := cmd.Run(); err != nil {
			// Don't exit on PM2 stop/delete errors as the process might not exist
			if step.command == "pm2" && (step.args[0] == "stop" || step.args[0] == "delete") {
				continue
			}
			log.Printf("Error during %s: %v\n", step.name, err)
			if step.command != "npm" || step.args[0] != "install" {
				log.Fatal("Deployment failed")
			}
		}
	}

	// Write Nginx configuration
	nginxConfig := `location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}`

	nginxPath := filepath.Join("/home/run-lynxier/nginx.conf")
	if err := os.WriteFile(nginxPath, []byte(nginxConfig), 0644); err != nil {
		log.Printf("Warning: Could not write Nginx configuration: %v", err)
	}

	fmt.Println("\n✅ Deployment completed!")
	fmt.Println("\nNext steps:")
	fmt.Println("1. Import the nginx.conf file in CloudPanel > Sites > lynxier.run.place > Vhost")
	fmt.Println("2. Your application should be accessible at: https://lynxier.run.place")
}
