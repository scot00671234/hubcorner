document.addEventListener('DOMContentLoaded', function() {
    // Handle post voting
    setupVoting('.vote-btn[data-post-id]', '/posts/vote', 'post_id');
    
    // Handle comment voting
    setupVoting('.vote-btn[data-comment-id]', '/comments/vote', 'comment_id');
    
    // Handle reply buttons
    setupReplyButtons();
});

/**
 * Sets up voting functionality for posts or comments
 * @param {string} selector - CSS selector for vote buttons
 * @param {string} endpoint - API endpoint for voting
 * @param {string} idParam - Parameter name for the item ID
 */
function setupVoting(selector, endpoint, idParam) {
    const voteButtons = document.querySelectorAll(selector);
    
    voteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute(`data-${idParam.replace('_', '-')}`);
            const voteType = this.getAttribute('data-vote-type');
            const isUpvote = voteType === '1';
            
            // Get the vote controls container
            const voteControls = this.closest('.vote-controls');
            const scoreElement = voteControls.querySelector('.vote-score');
            const upvoteButton = voteControls.querySelector('.upvote');
            const downvoteButton = voteControls.querySelector('.downvote');
            
            // Send the vote request
            const formData = new FormData();
            formData.append(idParam, itemId);
            formData.append('vote_type', voteType);
            
            fetch(endpoint, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Update the score
                scoreElement.textContent = data.score;
                
                // Toggle active state on buttons
                if (this.classList.contains('active')) {
                    // If already active, remove active state (toggle off)
                    this.classList.remove('active');
                } else {
                    // Add active state to this button, remove from the other
                    if (isUpvote) {
                        upvoteButton.classList.add('active');
                        downvoteButton.classList.remove('active');
                    } else {
                        downvoteButton.classList.add('active');
                        upvoteButton.classList.remove('active');
                    }
                }
            })
            .catch(error => {
                console.error('Error voting:', error);
            });
        });
    });
}

/**
 * Sets up reply functionality for comments
 */
function setupReplyButtons() {
    // Show reply form when reply button is clicked
    const replyButtons = document.querySelectorAll('.reply-btn');
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            
            // Hide all other reply forms
            document.querySelectorAll('.reply-form-container').forEach(form => {
                if (form.id !== `reply-form-${commentId}`) {
                    form.style.display = 'none';
                }
            });
            
            // Toggle this reply form
            replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            
            // Focus on textarea if form is shown
            if (replyForm.style.display === 'block') {
                replyForm.querySelector('textarea').focus();
            }
        });
    });
    
    // Cancel reply when cancel button is clicked
    const cancelButtons = document.querySelectorAll('.cancel-reply');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            replyForm.style.display = 'none';
        });
    });
}

/**
 * Helper function for the post.html template
 * Creates a dictionary-like object for template rendering
 */
function dict(obj) {
    return obj;
}
