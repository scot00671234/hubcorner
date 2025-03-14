
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

	// Check if we're in the project root
	if _, err := os.Stat("main.go"); os.IsNotExist(err) {
		log.Fatal("Error: Must be run from project root directory (where main.go is located)")
	}

	// Create data directory if it doesn't exist
	dataDir := filepath.Join("./data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Could not create data directory: %v", err)
	} else {
		fmt.Println("✅ Data directory created/verified at ./data")
	}

	// Ensure data directory has correct permissions
	if err := os.Chmod(dataDir, 0755); err != nil {
		log.Printf("Warning: Could not set permissions on data directory: %v", err)
	} else {
		fmt.Println("✅ Data directory permissions set")
	}
	
	// Verify data directory is writable
	testFile := filepath.Join(dataDir, ".test_write")
	f, err := os.Create(testFile)
	if err != nil {
		log.Printf("Warning: Data directory is not writable: %v", err)
		log.Printf("Please check permissions and ownership of %s", dataDir)
	} else {
		f.Close()
		os.Remove(testFile)
		fmt.Println("✅ Data directory is writable")
	}

	// Build the Go application
	fmt.Println("\n➡️ Building Go application...")
	buildCmd := exec.Command("go", "build", "-o", "hubcorner")
	buildCmd.Stdout = os.Stdout
	buildCmd.Stderr = os.Stderr
	
	if err := buildCmd.Run(); err != nil {
		log.Fatalf("Failed to build application: %v", err)
	}
	
	fmt.Println("\n✅ Build successful!")
	
	// Display next steps
	fmt.Println("\nNext steps:")
	fmt.Println("1. Run the setup script to install as a service:")
	fmt.Println("   sudo ./setup-service.sh")
	fmt.Println("2. Or run the application directly:")
	fmt.Println("   ./hubcorner")
	fmt.Println("\nIMPORTANT: The database is stored in the ./data directory. Make sure this directory")
	fmt.Println("has the correct permissions and is backed up regularly.")
}
