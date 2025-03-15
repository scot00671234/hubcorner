package main

import (
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"hubcorner/internal/database"
	"hubcorner/internal/handlers"
	"hubcorner/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Initialize the database
	dbPath := filepath.Join(".", "hubcorner.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	if err := database.InitDB(db); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create a new server instance
	server := &http.Server{
		Addr:         ":8080",
		Handler:      setupRoutes(db),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Start the server
	fmt.Println("Server started at http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}

func setupRoutes(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	// Serve static files
	fs := http.FileServer(http.Dir("./web/static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	// Create template cache
	tmpl, err := template.ParseGlob("./web/templates/*.html")
	if err != nil {
		log.Fatalf("Failed to parse templates: %v", err)
	}

	// Initialize handlers
	h := handlers.NewHandler(db, tmpl)

	// Front page
	mux.HandleFunc("/", h.FrontPage)

	// Community routes
	mux.HandleFunc("/communities", h.ListCommunities)
	mux.HandleFunc("/communities/new", h.NewCommunity)
	mux.HandleFunc("/communities/create", h.CreateCommunity)
	mux.HandleFunc("/c/", h.ViewCommunity)

	// Post routes
	mux.HandleFunc("/posts/new", h.NewPost)
	mux.HandleFunc("/posts/create", h.CreatePost)
	mux.HandleFunc("/posts/", h.ViewPost)
	mux.HandleFunc("/posts/vote", h.VotePost)

	// Comment routes
	mux.HandleFunc("/comments/create", h.CreateComment)
	mux.HandleFunc("/comments/vote", h.VoteComment)

	return mux
}
