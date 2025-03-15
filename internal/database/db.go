package database

import (
	"database/sql"
	"log"
)

// InitDB initializes the database schema
func InitDB(db *sql.DB) error {
	// Create communities table
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS communities (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		description TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Printf("Error creating communities table: %v", err)
		return err
	}

	// Create posts table
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS posts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		content TEXT,
		community_id INTEGER,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		upvotes INTEGER DEFAULT 0,
		downvotes INTEGER DEFAULT 0,
		FOREIGN KEY (community_id) REFERENCES communities(id)
	)`)
	if err != nil {
		log.Printf("Error creating posts table: %v", err)
		return err
	}

	// Create comments table
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content TEXT NOT NULL,
		post_id INTEGER,
		parent_id INTEGER DEFAULT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		upvotes INTEGER DEFAULT 0,
		downvotes INTEGER DEFAULT 0,
		FOREIGN KEY (post_id) REFERENCES posts(id),
		FOREIGN KEY (parent_id) REFERENCES comments(id)
	)`)
	if err != nil {
		log.Printf("Error creating comments table: %v", err)
		return err
	}

	// Create votes table to track unique votes (one vote per item)
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS votes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		item_type TEXT NOT NULL,  -- 'post' or 'comment'
		item_id INTEGER NOT NULL,
		client_id TEXT NOT NULL,  -- client identifier (cookie or IP)
		vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(item_type, item_id, client_id)
	)`)
	if err != nil {
		log.Printf("Error creating votes table: %v", err)
		return err
	}

	return nil
}

// GetCommunities retrieves all communities from the database
func GetCommunities(db *sql.DB) ([]map[string]interface{}, error) {
	rows, err := db.Query(`
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

// CreateCommunity adds a new community to the database
func CreateCommunity(db *sql.DB, name, description string) (int64, error) {
	result, err := db.Exec("INSERT INTO communities (name, description) VALUES (?, ?)", name, description)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// GetCommunity retrieves a single community by ID
func GetCommunity(db *sql.DB, id int) (map[string]interface{}, error) {
	var name, description, createdAt string
	err := db.QueryRow("SELECT name, description, created_at FROM communities WHERE id = ?", id).Scan(&name, &description, &createdAt)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"id":          id,
		"name":        name,
		"description": description,
		"created_at":  createdAt,
	}, nil
}

// GetCommunityByName retrieves a single community by name
func GetCommunityByName(db *sql.DB, name string) (map[string]interface{}, error) {
	var id int
	var description, createdAt string
	err := db.QueryRow("SELECT id, description, created_at FROM communities WHERE name = ?", name).Scan(&id, &description, &createdAt)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"id":          id,
		"name":        name,
		"description": description,
		"created_at":  createdAt,
	}, nil
}

// GetPosts retrieves posts with optional filtering by community
func GetPosts(db *sql.DB, communityID int) ([]map[string]interface{}, error) {
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

	rows, err := db.Query(query, args...)
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

// CreatePost adds a new post to the database
func CreatePost(db *sql.DB, title, content string, communityID int) (int64, error) {
	result, err := db.Exec("INSERT INTO posts (title, content, community_id) VALUES (?, ?, ?)", title, content, communityID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// GetPost retrieves a single post by ID
func GetPost(db *sql.DB, id int) (map[string]interface{}, error) {
	var title, content, createdAt, communityName string
	var communityID, upvotes, downvotes int
	err := db.QueryRow(`
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

// GetComments retrieves comments for a post
func GetComments(db *sql.DB, postID int) ([]map[string]interface{}, error) {
	rows, err := db.Query(`
	SELECT id, content, post_id, parent_id, created_at, upvotes, downvotes
	FROM comments
	WHERE post_id = ?
	ORDER BY (upvotes - downvotes) DESC, created_at ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var id, postID, upvotes, downvotes int
		var content, createdAt string
		var parentID sql.NullInt64
		if err := rows.Scan(&id, &content, &postID, &parentID, &createdAt, &upvotes, &downvotes); err != nil {
			return nil, err
		}

		var parentIDValue interface{}
		if parentID.Valid {
			parentIDValue = parentID.Int64
		} else {
			parentIDValue = nil
		}

		comments = append(comments, map[string]interface{}{
			"id":         id,
			"content":    content,
			"post_id":    postID,
			"parent_id":  parentIDValue,
			"created_at": createdAt,
			"upvotes":    upvotes,
			"downvotes":  downvotes,
			"score":      upvotes - downvotes,
		})
	}
	return comments, nil
}

// CreateComment adds a new comment to the database
func CreateComment(db *sql.DB, content string, postID int, parentID *int) (int64, error) {
	var result sql.Result
	var err error

	if parentID != nil {
		result, err = db.Exec("INSERT INTO comments (content, post_id, parent_id) VALUES (?, ?, ?)", content, postID, parentID)
	} else {
		result, err = db.Exec("INSERT INTO comments (content, post_id) VALUES (?, ?)", content, postID)
	}

	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// VotePost handles voting on a post
func VotePost(db *sql.DB, postID int, clientID string, voteType int) error {
	tx, err := db.Begin()
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

	// Check if user already voted on this post
	var existingVoteType int
	var voteExists bool
	err = tx.QueryRow("SELECT vote_type FROM votes WHERE item_type = 'post' AND item_id = ? AND client_id = ?", postID, clientID).Scan(&existingVoteType)
	if err == nil {
		voteExists = true
	} else if err != sql.ErrNoRows {
		return err
	}

	if voteExists {
		// If vote type is the same, remove the vote (toggle off)
		if existingVoteType == voteType {
			_, err = tx.Exec("DELETE FROM votes WHERE item_type = 'post' AND item_id = ? AND client_id = ?", postID, clientID)
			if err != nil {
				return err
			}

			// Update post vote counts
			if voteType == 1 {
				_, err = tx.Exec("UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?", postID)
			} else {
				_, err = tx.Exec("UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?", postID)
			}
			if err != nil {
				return err
			}
		} else {
			// If vote type is different, update the vote
			_, err = tx.Exec("UPDATE votes SET vote_type = ? WHERE item_type = 'post' AND item_id = ? AND client_id = ?", voteType, postID, clientID)
			if err != nil {
				return err
			}

			// Update post vote counts
			if voteType == 1 {
				_, err = tx.Exec("UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", postID)
			} else {
				_, err = tx.Exec("UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?", postID)
			}
			if err != nil {
				return err
			}
		}
	} else {
		// Insert new vote
		_, err = tx.Exec("INSERT INTO votes (item_type, item_id, client_id, vote_type) VALUES ('post', ?, ?, ?)", postID, clientID, voteType)
		if err != nil {
			return err
		}

		// Update post vote counts
		if voteType == 1 {
			_, err = tx.Exec("UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?", postID)
		} else {
			_, err = tx.Exec("UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?", postID)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

// VoteComment handles voting on a comment
func VoteComment(db *sql.DB, commentID int, clientID string, voteType int) error {
	tx, err := db.Begin()
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

	// Check if user already voted on this comment
	var existingVoteType int
	var voteExists bool
	err = tx.QueryRow("SELECT vote_type FROM votes WHERE item_type = 'comment' AND item_id = ? AND client_id = ?", commentID, clientID).Scan(&existingVoteType)
	if err == nil {
		voteExists = true
	} else if err != sql.ErrNoRows {
		return err
	}

	if voteExists {
		// If vote type is the same, remove the vote (toggle off)
		if existingVoteType == voteType {
			_, err = tx.Exec("DELETE FROM votes WHERE item_type = 'comment' AND item_id = ? AND client_id = ?", commentID, clientID)
			if err != nil {
				return err
			}

			// Update comment vote counts
			if voteType == 1 {
				_, err = tx.Exec("UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?", commentID)
			} else {
				_, err = tx.Exec("UPDATE comments SET downvotes = downvotes - 1 WHERE id = ?", commentID)
			}
			if err != nil {
				return err
			}
		} else {
			// If vote type is different, update the vote
			_, err = tx.Exec("UPDATE votes SET vote_type = ? WHERE item_type = 'comment' AND item_id = ? AND client_id = ?", voteType, commentID, clientID)
			if err != nil {
				return err
			}

			// Update comment vote counts
			if voteType == 1 {
				_, err = tx.Exec("UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", commentID)
			} else {
				_, err = tx.Exec("UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?", commentID)
			}
			if err != nil {
				return err
			}
		}
	} else {
		// Insert new vote
		_, err = tx.Exec("INSERT INTO votes (item_type, item_id, client_id, vote_type) VALUES ('comment', ?, ?, ?)", commentID, clientID, voteType)
		if err != nil {
			return err
		}

		// Update comment vote counts
		if voteType == 1 {
			_, err = tx.Exec("UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?", commentID)
		} else {
			_, err = tx.Exec("UPDATE comments SET downvotes = downvotes + 1 WHERE id = ?", commentID)
		}
		if err != nil {
			return err
		}
	}

	return nil
}
