package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Handler holds dependencies for handlers
type Handler struct {
	DB     *sql.DB
	Tmpl   *template.Template
}

// NewHandler creates a new handler instance
func NewHandler(db *sql.DB, tmpl *template.Template) *Handler {
	return &Handler{
		DB:   db,
		Tmpl: tmpl,
	}
}

// FrontPage handles the front page of the site
func (h *Handler) FrontPage(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	// Get posts for the front page (all communities)
	posts, err := h.getPosts(0)
	if err != nil {
		http.Error(w, "Failed to get posts", http.StatusInternalServerError)
		return
	}

	// Get communities for the sidebar
	communities, err := h.getCommunities()
	if err != nil {
		http.Error(w, "Failed to get communities", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title":       "HubCorner - Front Page",
		"Posts":       posts,
		"Communities": communities,
	}

	h.Tmpl.ExecuteTemplate(w, "index.html", data)
}

// ListCommunities handles listing all communities
func (h *Handler) ListCommunities(w http.ResponseWriter, r *http.Request) {
	communities, err := h.getCommunities()
	if err != nil {
		http.Error(w, "Failed to get communities", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title":       "All Communities",
		"Communities": communities,
	}

	h.Tmpl.ExecuteTemplate(w, "communities.html", data)
}

// NewCommunity handles the form for creating a new community
func (h *Handler) NewCommunity(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Create New Community",
	}

	h.Tmpl.ExecuteTemplate(w, "new_community.html", data)
}

// CreateCommunity handles the POST request to create a new community
func (h *Handler) CreateCommunity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := r.FormValue("name")
	description := r.FormValue("description")

	if name == "" {
		http.Error(w, "Community name is required", http.StatusBadRequest)
		return
	}

	// Create community in database
	_, err := h.DB.Exec("INSERT INTO communities (name, description) VALUES (?, ?)", name, description)
	if err != nil {
		http.Error(w, "Failed to create community", http.StatusInternalServerError)
		return
	}

	// Redirect to communities list
	http.Redirect(w, r, "/communities", http.StatusSeeOther)
}

// ViewCommunity handles viewing a single community and its posts
func (h *Handler) ViewCommunity(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 3 {
		http.NotFound(w, r)
		return
	}

	communityName := pathParts[2]
	
	// Get community by name
	var communityID int
	var description string
	err := h.DB.QueryRow("SELECT id, description FROM communities WHERE name = ?", communityName).Scan(&communityID, &description)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Get posts for this community
	posts, err := h.getPosts(communityID)
	if err != nil {
		http.Error(w, "Failed to get posts", http.StatusInternalServerError)
		return
	}

	// Get all communities for the sidebar
	communities, err := h.getCommunities()
	if err != nil {
		http.Error(w, "Failed to get communities", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title":           fmt.Sprintf("c/%s", communityName),
		"CommunityID":     communityID,
		"CommunityName":   communityName,
		"Description":     description,
		"Posts":           posts,
		"Communities":     communities,
	}

	h.Tmpl.ExecuteTemplate(w, "community.html", data)
}

// NewPost handles the form for creating a new post
func (h *Handler) NewPost(w http.ResponseWriter, r *http.Request) {
	communityID := r.URL.Query().Get("community_id")

	// Get all communities for the dropdown
	communities, err := h.getCommunities()
	if err != nil {
		http.Error(w, "Failed to get communities", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title":       "Create New Post",
		"CommunityID": communityID,
		"Communities": communities,
	}

	h.Tmpl.ExecuteTemplate(w, "new_post.html", data)
}

// CreatePost handles the POST request to create a new post
func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	title := r.FormValue("title")
	content := r.FormValue("content")
	communityIDStr := r.FormValue("community_id")

	if title == "" {
		http.Error(w, "Post title is required", http.StatusBadRequest)
		return
	}

	communityID, err := strconv.Atoi(communityIDStr)
	if err != nil {
		http.Error(w, "Invalid community ID", http.StatusBadRequest)
		return
	}

	// Create post in database
	result, err := h.DB.Exec("INSERT INTO posts (title, content, community_id) VALUES (?, ?, ?)", title, content, communityID)
	if err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	postID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to get post ID", http.StatusInternalServerError)
		return
	}

	// Redirect to view the new post
	http.Redirect(w, r, fmt.Sprintf("/posts/%d", postID), http.StatusSeeOther)
}

// ViewPost handles viewing a single post and its comments
func (h *Handler) ViewPost(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 3 {
		http.NotFound(w, r)
		return
	}

	postIDStr := pathParts[2]
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Get post details
	post, err := h.getPost(postID)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Get comments for this post
	comments, err := h.getComments(postID)
	if err != nil {
		http.Error(w, "Failed to get comments", http.StatusInternalServerError)
		return
	}

	// Get all communities for the sidebar
	communities, err := h.getCommunities()
	if err != nil {
		http.Error(w, "Failed to get communities", http.StatusInternalServerError)
		return
	}

	// Get client ID for voting
	clientID := h.getClientID(r)

	// Get user's votes on this post and its comments
	postVotes, commentVotes, err := h.getUserVotes(clientID, postID)
	if err != nil {
		http.Error(w, "Failed to get user votes", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title":         post["title"].(string),
		"Post":          post,
		"Comments":      comments,
		"Communities":   communities,
		"ClientID":      clientID,
		"PostVotes":     postVotes,
		"CommentVotes":  commentVotes,
	}

	h.Tmpl.ExecuteTemplate(w, "post.html", data)
}

// CreateComment handles the POST request to create a new comment
func (h *Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	content := r.FormValue("content")
	postIDStr := r.FormValue("post_id")
	parentIDStr := r.FormValue("parent_id")

	if content == "" {
		http.Error(w, "Comment content is required", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var parentID *int
	if parentIDStr != "" {
		parentIDInt, err := strconv.Atoi(parentIDStr)
		if err == nil {
			parentID = &parentIDInt
		}
	}

	// Create comment in database
	_, err = h.DB.Exec("INSERT INTO comments (content, post_id, parent_id) VALUES (?, ?, ?)", content, postID, parentID)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	// Redirect back to the post
	http.Redirect(w, r, fmt.Sprintf("/posts/%d", postID), http.StatusSeeOther)
}

// VotePost handles voting on a post
func (h *Handler) VotePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	postIDStr := r.FormValue("post_id")
	voteTypeStr := r.FormValue("vote_type")
	
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	voteType, err := strconv.Atoi(voteTypeStr)
	if err != nil || (voteType != 1 && voteType != -1) {
		http.Error(w, "Invalid vote type", http.StatusBadRequest)
		return
	}

	// Get client ID
	clientID := h.getClientID(r)

	// Process the vote
	err = h.processVote("post", postID, clientID, voteType)
	if err != nil {
		http.Error(w, "Failed to process vote", http.StatusInternalServerError)
		return
	}

	// Return updated vote count
	var upvotes, downvotes int
	err = h.DB.QueryRow("SELECT upvotes, downvotes FROM posts WHERE id = ?", postID).Scan(&upvotes, &downvotes)
	if err != nil {
		http.Error(w, "Failed to get updated vote count", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"upvotes":   upvotes,
		"downvotes": downvotes,
		"score":     upvotes - downvotes,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// VoteComment handles voting on a comment
func (h *Handler) VoteComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	commentIDStr := r.FormValue("comment_id")
	voteTypeStr := r.FormValue("vote_type")
	
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	voteType, err := strconv.Atoi(voteTypeStr)
	if err != nil || (voteType != 1 && voteType != -1) {
		http.Error(w, "Invalid vote type", http.StatusBadRequest)
		return
	}

	// Get client ID
	clientID := h.getClientID(r)

	// Process the vote
	err = h.processVote("comment", commentID, clientID, voteType)
	if err != nil {
		http.Error(w, "Failed to process vote", http.StatusInternalServerError)
		return
	}

	// Return updated vote count
	var upvotes, downvotes int
	err = h.DB.QueryRow("SELECT upvotes, downvotes FROM comments WHERE id = ?", commentID).Scan(&upvotes, &downvotes)
	if err != nil {
		http.Error(w, "Failed to get updated vote count", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"upvotes":   upvotes,
		"downvotes": downvotes,
		"score":     upvotes - downvotes,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
