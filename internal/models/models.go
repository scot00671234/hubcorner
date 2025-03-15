package models

import (
	"time"
)

// Community represents a community in the application
type Community struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	PostCount   int       `json:"post_count"`
}

// Post represents a post in the application
type Post struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	CommunityID  int       `json:"community_id"`
	CommunityName string   `json:"community_name"`
	CreatedAt    time.Time `json:"created_at"`
	Upvotes      int       `json:"upvotes"`
	Downvotes    int       `json:"downvotes"`
	Score        int       `json:"score"`
	CommentCount int       `json:"comment_count"`
}

// Comment represents a comment in the application
type Comment struct {
	ID        int        `json:"id"`
	Content   string     `json:"content"`
	PostID    int        `json:"post_id"`
	ParentID  *int       `json:"parent_id"`
	CreatedAt time.Time  `json:"created_at"`
	Upvotes   int        `json:"upvotes"`
	Downvotes int        `json:"downvotes"`
	Score     int        `json:"score"`
	Replies   []*Comment `json:"replies,omitempty"`
}

// Vote represents a vote in the application
type Vote struct {
	ID        int       `json:"id"`
	ItemType  string    `json:"item_type"` // "post" or "comment"
	ItemID    int       `json:"item_id"`
	ClientID  string    `json:"client_id"`
	VoteType  int       `json:"vote_type"` // 1 for upvote, -1 for downvote
	CreatedAt time.Time `json:"created_at"`
}

// BuildCommentTree organizes comments into a tree structure
func BuildCommentTree(comments []Comment) []*Comment {
	commentMap := make(map[int]*Comment)
	var rootComments []*Comment

	// First pass: create a map of all comments
	for i := range comments {
		comment := &comments[i]
		comment.Replies = []*Comment{}
		commentMap[comment.ID] = comment
	}

	// Second pass: build the tree structure
	for _, comment := range commentMap {
		if comment.ParentID == nil {
			// This is a root comment
			rootComments = append(rootComments, comment)
		} else {
			// This is a reply
			parentID := *comment.ParentID
			if parent, exists := commentMap[parentID]; exists {
				parent.Replies = append(parent.Replies, comment)
			}
		}
	}

	return rootComments
}
