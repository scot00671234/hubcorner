package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"
)

// Helper methods for handlers

// getCommunities retrieves all communities from the database
func (h *Handler) getCommunities() ([]map[string]interface{}, error) {
	rows, err := h.DB.Query(`
	SELECT id, name, description, created_at,
	       (SELECT COUNT(*) FROM posts WHERE community_id = communities.id) as post_count
	FROM communities
	ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var communities []map[string]interface{}
	for rows.Next() {
		var id int
		var name, description string
		var createdAt string
		var postCount int
		if err := rows.Scan(&id, &name, &description, &createdAt, &postCount); err != nil {
			return nil, err
		}
		communities = append(communities, map[string]interface{}{
			"id":          id,
			"name":        name,
			"description": description,
			"created_at":  createdAt,
			"post_count":  postCount,
		})
	}
	return communities, nil
}

// getPosts retrieves posts with optional filtering by community
func (h *Handler) getPosts(communityID int) ([]map[string]interface{}, error) {
	var query string
	var args []interface{}

	if communityID > 0 {
		query = `
		SELECT p.id, p.title, p.content, p.community_id, p.created_at, p.upvotes, p.downvotes, 
		       c.name as community_name,
		       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
		FROM posts p
		JOIN communities c ON p.community_id = c.id
		WHERE p.community_id = ?
		ORDER BY (p.upvotes - p.downvotes) DESC, p.created_at DESC
		`
		args = append(args, communityID)
	} else {
		query = `
		SELECT p.id, p.title, p.content, p.community_id, p.created_at, p.upvotes, p.downvotes, 
		       c.name as community_name,
		       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
		FROM posts p
		JOIN communities c ON p.community_id = c.id
		ORDER BY (p.upvotes - p.downvotes) DESC, p.created_at DESC
		`
	}

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var id, communityID, upvotes, downvotes, commentCount int
		var title, content, createdAt, communityName string
		if err := rows.Scan(&id, &title, &content, &communityID, &createdAt, &upvotes, &downvotes, &communityName, &commentCount); err != nil {
			return nil, err
		}
		posts = append(posts, map[string]interface{}{
			"id":             id,
			"title":          title,
			"content":        content,
			"community_id":   communityID,
			"community_name": communityName,
			"created_at":     createdAt,
			"upvotes":        upvotes,
			"downvotes":      downvotes,
			"score":          upvotes - downvotes,
			"comment_count":  commentCount,
		})
	}
	return posts, nil
}

// getPost retrieves a single post by ID
func (h *Handler) getPost(id int) (map[string]interface{}, error) {
	var title, content, createdAt, communityName string
	var communityID, upvotes, downvotes int
	err := h.DB.QueryRow(`
	SELECT p.title, p.content, p.created_at, p.community_id, p.upvotes, p.downvotes, c.name as community_name
	FROM posts p
	JOIN communities c ON p.community_id = c.id
	WHERE p.id = ?`, id).Scan(&title, &content, &createdAt, &communityID, &upvotes, &downvotes, &communityName)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"id":             id,
		"title":          title,
		"content":        content,
		"created_at":     createdAt,
		"community_id":   communityID,
		"community_name": communityName,
		"upvotes":        upvotes,
		"downvotes":      downvotes,
		"score":          upvotes - downvotes,
	}, nil
}

// getComments retrieves comments for a post and organizes them into a tree structure
func (h *Handler) getComments(postID int) ([]map[string]interface{}, error) {
	rows, err := h.DB.Query(`
	SELECT id, content, post_id, parent_id, created_at, upvotes, downvotes
	FROM comments
	WHERE post_id = ?
	ORDER BY created_at ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []map[string]interface{}
	commentMap := make(map[int]map[string]interface{})
	
	// First pass: create all comment objects
	for rows.Next() {
		var id, postID, upvotes, downvotes int
		var content, createdAt string
		var parentID sql.NullInt64
		if err := rows.Scan(&id, &content, &postID, &parentID, &createdAt, &upvotes, &downvotes); err != nil {
			return nil, err
		}

		var parentIDValue interface{}
		if parentID.Valid {
			parentIDValue = int(parentID.Int64)
		} else {
			parentIDValue = nil
		}

		comment := map[string]interface{}{
			"id":         id,
			"content":    content,
			"post_id":    postID,
			"parent_id":  parentIDValue,
			"created_at": createdAt,
			"upvotes":    upvotes,
			"downvotes":  downvotes,
			"score":      upvotes - downvotes,
			"replies":    []map[string]interface{}{},
		}
		
		commentMap[id] = comment
	}

	// Second pass: build the tree structure
	for _, comment := range commentMap {
		if comment["parent_id"] == nil {
			// This is a root comment
			comments = append(comments, comment)
		} else {
			// This is a reply
			parentID := comment["parent_id"].(int)
			if parent, exists := commentMap[parentID]; exists {
				replies := parent["replies"].([]map[string]interface{})
				parent["replies"] = append(replies, comment)
			}
		}
	}

	return comments, nil
}

// getClientID gets a unique identifier for the client (for voting)
func (h *Handler) getClientID(r *http.Request) string {
	// Check for existing cookie
	cookie, err := r.Cookie("client_id")
	if err == nil {
		return cookie.Value
	}

	// Generate a new client ID based on IP and timestamp
	clientID := r.RemoteAddr + "_" + strconv.FormatInt(time.Now().UnixNano(), 10)
	return clientID
}

// getUserVotes gets the user's votes for a post and its comments
func (h *Handler) getUserVotes(clientID string, postID int) (map[int]int, map[int]int, error) {
	// Get user's vote on the post
	postVotes := make(map[int]int)
	var postVoteType int
	err := h.DB.QueryRow("SELECT vote_type FROM votes WHERE item_type = 'post' AND item_id = ? AND client_id = ?", postID, clientID).Scan(&postVoteType)
	if err == nil {
		postVotes[postID] = postVoteType
	} else if err != sql.ErrNoRows {
		return nil, nil, err
	}

	// Get user's votes on comments
	commentVotes := make(map[int]int)
	rows, err := h.DB.Query(`
	SELECT item_id, vote_type 
	FROM votes 
	WHERE item_type = 'comment' AND client_id = ? AND item_id IN (
		SELECT id FROM comments WHERE post_id = ?
	)`, clientID, postID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var commentID, voteType int
		if err := rows.Scan(&commentID, &voteType); err != nil {
			return nil, nil, err
		}
		commentVotes[commentID] = voteType
	}

	return postVotes, commentVotes, nil
}

// processVote processes a vote on a post or comment
func (h *Handler) processVote(itemType string, itemID int, clientID string, voteType int) error {
	tx, err := h.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
			return
		}
		err = tx.Commit()
	}()

	// Check if user already voted on this item
	var existingVoteType int
	var voteExists bool
	err = tx.QueryRow("SELECT vote_type FROM votes WHERE item_type = ? AND item_id = ? AND client_id = ?", itemType, itemID, clientID).Scan(&existingVoteType)
	if err == nil {
		voteExists = true
	} else if err != sql.ErrNoRows {
		return err
	}

	if voteExists {
		// If vote type is the same, remove the vote (toggle off)
		if existingVoteType == voteType {
			_, err = tx.Exec("DELETE FROM votes WHERE item_type = ? AND item_id = ? AND client_id = ?", itemType, itemID, clientID)
			if err != nil {
				return err
			}

			// Update item vote counts
			var updateQuery string
			if itemType == "post" {
				if voteType == 1 {
					updateQuery = "UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?"
				} else {
					updateQuery = "UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?"
				}
			} else {
				if voteType == 1 {
					updateQuery = "UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?"
				} else {
					updateQuery = "UPDATE comments SET downvotes = downvotes - 1 WHERE id = ?"
				}
			}
			_, err = tx.Exec(updateQuery, itemID)
			if err != nil {
				return err
			}
		} else {
			// If vote type is different, update the vote
			_, err = tx.Exec("UPDATE votes SET vote_type = ? WHERE item_type = ? AND item_id = ? AND client_id = ?", voteType, itemType, itemID, clientID)
			if err != nil {
				return err
			}

			// Update item vote counts
			var updateQuery string
			if itemType == "post" {
				if voteType == 1 {
					updateQuery = "UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?"
				} else {
					updateQuery = "UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?"
				}
			} else {
				if voteType == 1 {
					updateQuery = "UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?"
				} else {
					updateQuery = "UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?"
				}
			}
			_, err = tx.Exec(updateQuery, itemID)
			if err != nil {
				return err
			}
		}
	} else {
		// Insert new vote
		_, err = tx.Exec("INSERT INTO votes (item_type, item_id, client_id, vote_type) VALUES (?, ?, ?, ?)", itemType, itemID, clientID, voteType)
		if err != nil {
			return err
		}

		// Update item vote counts
		var updateQuery string
		if itemType == "post" {
			if voteType == 1 {
				updateQuery = "UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?"
			} else {
				updateQuery = "UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?"
			}
		} else {
			if voteType == 1 {
				updateQuery = "UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?"
			} else {
				updateQuery = "UPDATE comments SET downvotes = downvotes + 1 WHERE id = ?"
			}
		}
		_, err = tx.Exec(updateQuery, itemID)
		if err != nil {
			return err
		}
	}

	return nil
}
