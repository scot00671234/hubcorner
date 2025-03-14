
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./src/config');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Initialize SQLite database
const db = new sqlite3.Database(config.DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${config.DB_PATH}`);
    
    // Create tables if they don't exist
    db.serialize(() => {
      // Create communities table
      db.run(`CREATE TABLE IF NOT EXISTS communities (
        name TEXT PRIMARY KEY,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Create posts table
      db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        community TEXT NOT NULL,
        author TEXT DEFAULT 'anonymous',
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (community) REFERENCES communities (name)
      )`);
      
      // Create comments table
      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'anonymous',
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )`);
      
      // Create votes table
      db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        post_id TEXT,
        comment_id TEXT,
        vote_type TEXT CHECK(vote_type IN ('up', 'down')),
        UNIQUE(user_id, post_id, comment_id)
      )`);
    
      // Insert default communities if they don't exist
      const defaultCommunities = [
        ['philosophy', 'Discuss philosophical topics and ideas'],
        ['technology', 'Share and learn about the latest in tech'],
        ['community', 'Community building and social discourse'],
        ['science', 'Scientific discoveries and discussions'],
        ['art', 'Share and appreciate art in all forms'],
        ['law', 'Legal discussions and advice'],
        ['medicine', 'Medical discussions and health advice'],
        ['education', 'Topics related to learning and teaching'],
        ['gaming', 'Discussions about gaming'],
      ];
      
      const insertCommunity = db.prepare('INSERT OR IGNORE INTO communities (name, description) VALUES (?, ?)');
      defaultCommunities.forEach(community => {
        insertCommunity.run(community);
      });
      insertCommunity.finalize();
      
      console.log('Database schema initialized with default communities');
    });
  }
});

// API Routes - all API routes should be defined BEFORE the static file middleware
// ==============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Get all communities
app.get('/api/communities', (req, res) => {
  console.log('GET /api/communities - Fetching all communities');
  db.all('SELECT * FROM communities ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching communities:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Returning ${rows.length} communities`);
    res.json(rows);
  });
});

// Get a specific community
app.get('/api/communities/:name', (req, res) => {
  console.log(`GET /api/communities/${req.params.name} - Fetching community details`);
  db.get('SELECT * FROM communities WHERE name = ?', [req.params.name], (err, row) => {
    if (err) {
      console.error('Error fetching community:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      console.log(`Community '${req.params.name}' not found`);
      res.status(404).json({ error: 'Community not found' });
      return;
    }
    res.json(row);
  });
});

// Get posts by community
app.get('/api/communities/:name/posts', (req, res) => {
  console.log(`GET /api/communities/${req.params.name}/posts - Fetching posts for community`);
  db.all(
    'SELECT * FROM posts WHERE community = ? ORDER BY created_at DESC',
    [req.params.name],
    (err, rows) => {
      if (err) {
        console.error(`Error fetching posts for ${req.params.name}:`, err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Count comments for each post
      const getCommentCounts = rows.map(post => {
        return new Promise((resolve) => {
          db.get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [post.id], (err, result) => {
            if (err || !result) {
              post.comments = 0;
            } else {
              post.comments = result.count;
            }
            resolve(post);
          });
        });
      });
      
      Promise.all(getCommentCounts).then(postsWithComments => {
        console.log(`Returning ${postsWithComments.length} posts for ${req.params.name}`);
        res.json(postsWithComments);
      });
    }
  );
});

// Create a new post
app.post('/api/posts', (req, res) => {
  const { id, title, content, community, author = 'anonymous' } = req.body;
  
  if (!id || !title || !content || !community) {
    res.status(400).json({ error: 'Missing required post fields' });
    return;
  }
  
  db.run(
    'INSERT INTO posts (id, title, content, community, author, votes) VALUES (?, ?, ?, ?, ?, 0)',
    [id, title, content, community, author],
    function(err) {
      if (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id,
        title,
        content,
        community,
        author,
        votes: 0,
        comments: 0
      });
    }
  );
});

// Get a specific post
app.get('/api/posts/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err) {
      console.error('Error fetching post:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    // Get comment count
    db.get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [req.params.id], (err, result) => {
      if (err) {
        console.error('Error counting comments:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      post.comments = result.count;
      res.json(post);
    });
  });
});

// Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
  db.all(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Add a comment to a post
app.post('/api/posts/:id/comments', (req, res) => {
  const { id, content, author = 'anonymous' } = req.body;
  const postId = req.params.id;
  
  if (!id || !content) {
    res.status(400).json({ error: 'Missing required comment fields' });
    return;
  }
  
  db.run(
    'INSERT INTO comments (id, post_id, content, author, votes) VALUES (?, ?, ?, ?, 0)',
    [id, postId, content, author],
    function(err) {
      if (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id,
        post_id: postId,
        content,
        author,
        votes: 0
      });
    }
  );
});

// Vote on a post
app.post('/api/posts/:id/vote', (req, res) => {
  const { user_id = 'anonymous', vote_type } = req.body;
  const post_id = req.params.id;
  
  if (!vote_type || !['up', 'down'].includes(vote_type)) {
    res.status(400).json({ error: 'Invalid vote type' });
    return;
  }
  
  // Begin transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Check if user already voted
    db.get(
      'SELECT * FROM votes WHERE user_id = ? AND post_id = ?',
      [user_id, post_id],
      (err, vote) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error checking vote:', err);
          res.status(500).json({ error: err.message });
          return;
        }
        
        let voteChange = 0;
        
        if (!vote) {
          // New vote
          db.run(
            'INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, ?)',
            [user_id, post_id, vote_type]
          );
          voteChange = vote_type === 'up' ? 1 : -1;
        } else if (vote.vote_type === vote_type) {
          // Remove vote if same type
          db.run(
            'DELETE FROM votes WHERE user_id = ? AND post_id = ?',
            [user_id, post_id]
          );
          voteChange = vote_type === 'up' ? -1 : 1;
        } else {
          // Change vote type
          db.run(
            'UPDATE votes SET vote_type = ? WHERE user_id = ? AND post_id = ?',
            [vote_type, user_id, post_id]
          );
          voteChange = vote_type === 'up' ? 2 : -2;
        }
        
        // Update post votes
        db.run(
          'UPDATE posts SET votes = votes + ? WHERE id = ?',
          [voteChange, post_id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error updating post votes:', err);
              res.status(500).json({ error: err.message });
              return;
            }
            
            db.get(
              'SELECT * FROM posts WHERE id = ?',
              [post_id],
              (err, post) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Error fetching updated post:', err);
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                db.run('COMMIT');
                res.json({
                  ...post,
                  userVoted: voteChange === 0 ? null : vote_type
                });
              }
            );
          }
        );
      }
    );
  });
});

// Create a new community
app.post('/api/communities', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'Community name is required' });
    return;
  }
  
  // Validate community name format
  if (!/^[a-z0-9-]+$/.test(name)) {
    res.status(400).json({ error: 'Community name can only contain lowercase letters, numbers, and hyphens' });
    return;
  }
  
  // Check if community already exists
  db.get('SELECT * FROM communities WHERE name = ?', [name], (err, row) => {
    if (err) {
      console.error('Error checking community:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(409).json({ error: 'A community with this name already exists' });
      return;
    }
    
    // Insert new community
    db.run(
      'INSERT INTO communities (name, description) VALUES (?, ?)',
      [name, description || `Discussions about ${name}`],
      function(err) {
        if (err) {
          console.error('Error creating community:', err);
          res.status(500).json({ error: err.message });
          return;
        }
        
        res.status(201).json({
          name,
          description: description || `Discussions about ${name}`,
          created_at: new Date().toISOString()
        });
      }
    );
  });
});

// Search API Routes
// Search for posts
app.get('/api/search/posts', (req, res) => {
  const query = req.query.q;
  
  if (!query || query.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${query}%`;
  
  db.all(
    `SELECT id, title, community 
     FROM posts 
     WHERE title LIKE ? OR content LIKE ? 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        console.error('Error searching posts:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Search for communities
app.get('/api/search/communities', (req, res) => {
  const query = req.query.q;
  
  if (!query || query.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${query}%`;
  
  db.all(
    `SELECT name, description 
     FROM communities 
     WHERE name LIKE ? OR description LIKE ? 
     ORDER BY name ASC 
     LIMIT 10`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        console.error('Error searching communities:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Search for comments
app.get('/api/search/comments', (req, res) => {
  const query = req.query.q;
  
  if (!query || query.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${query}%`;
  
  db.all(
    `SELECT c.id, c.content, c.post_id as postId
     FROM comments c
     WHERE c.content LIKE ?
     ORDER BY c.created_at DESC
     LIMIT 10`,
    [searchTerm],
    (err, rows) => {
      if (err) {
        console.error('Error searching comments:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving the React app
// This should be the LAST route
app.get('*', (req, res) => {
  console.log(`GET ${req.path} - Serving React app`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access your application at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Close database on app termination
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection');
    process.exit(0);
  });
});
