
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import type { Post as PostType } from "./Community";

interface Comment {
  id: string;
  content: string;
  author: string;
  votes: number;
  createdAt: string;
  replies: Comment[];
}

interface FullPost extends PostType {
  id: string;
  author: string;
  comments: Comment[];
}

// Mock database for posts (in a real app, this would be in your backend)
const mockPosts: Record<string, FullPost> = {
  "123": {
    id: "123",
    title: "The Beauty of Anonymous Discussions",
    content: "In today's digital age, anonymous discussions provide a unique space for honest dialogue. When identities are masked, people often feel more comfortable sharing their genuine thoughts and experiences.",
    author: "anonymous",
    votes: 42,
    comments: 1,
    community: "philosophy",
    comments: [
      {
        id: "1",
        content: "This is a great perspective on anonymity!",
        author: "user1",
        votes: 5,
        createdAt: "2024-02-20T10:00:00Z",
        replies: []
      }
    ]
  }
};

// Function to get stored posts from localStorage
const getStoredPosts = (): Record<string, FullPost> => {
  const storedPosts = localStorage.getItem('posts');
  const parsedPosts = storedPosts ? JSON.parse(storedPosts) : {};
  return { ...mockPosts, ...parsedPosts };
};

// Function to store posts in localStorage
const storePosts = (posts: Record<string, FullPost>) => {
  localStorage.setItem('posts', JSON.stringify(posts));
};

const Post = () => {
  const { postId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<FullPost | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [votes, setVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      navigate('/');
      return;
    }

    // Retrieve posts from localStorage
    const allPosts = getStoredPosts();
    const foundPost = allPosts[postId];

    if (foundPost) {
      setPost(foundPost);
      setComments(foundPost.comments || []);
      setVotes(foundPost.votes || 0);
    } else {
      toast({
        description: "Post not found",
        variant: "destructive",
      });
      navigate('/');
    }
    
    setLoading(false);
  }, [postId, navigate, toast]);

  const handleVote = (direction: "up" | "down") => {
    if (!post) return;

    const newVotes = direction === "up" ? votes + 1 : votes - 1;
    setVotes(newVotes);
    
    // Update in localStorage
    const allPosts = getStoredPosts();
    const updatedPost = { ...post, votes: newVotes };
    allPosts[post.id] = updatedPost;
    storePosts(allPosts);
    setPost(updatedPost);

    toast({
      description: `Vote ${direction === "up" ? "up" : "down"} registered`,
    });
  };

  const handleCommentVote = (commentId: string, direction: "up" | "down") => {
    setComments(prevComments => {
      const updateComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              votes: direction === "up" ? comment.votes + 1 : comment.votes - 1
            };
          } else if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComment(comment.replies)
            };
          }
          return comment;
        });
      };
      
      const newComments = updateComment(prevComments);
      
      // Update in localStorage if post exists
      if (post) {
        const allPosts = getStoredPosts();
        allPosts[post.id] = { ...post, comments: newComments };
        storePosts(allPosts);
      }
      
      return newComments;
    });

    toast({
      description: `Comment vote ${direction === "up" ? "up" : "down"} registered`,
    });
  };

  const handleAddComment = () => {
    if (!post || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: "anonymous",
      votes: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const newComments = [...comments, comment];
    setComments(newComments);
    
    // Update in localStorage
    const allPosts = getStoredPosts();
    const updatedPost = { 
      ...post, 
      comments: newComments,
      comments: post.comments + 1 
    };
    allPosts[post.id] = updatedPost;
    storePosts(allPosts);
    setPost(updatedPost);
    
    setNewComment("");
    toast({
      description: "Comment added successfully",
    });
  };

  const handleAddReply = (parentCommentId: string) => {
    if (!post || !replyContent.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      content: replyContent,
      author: "anonymous",
      votes: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const addReplyToComment = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...comment.replies, reply]
          };
        } else if (comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToComment(comment.replies)
          };
        }
        return comment;
      });
    };

    const newComments = addReplyToComment(comments);
    setComments(newComments);
    
    // Update in localStorage
    const allPosts = getStoredPosts();
    const updatedPost = { 
      ...post, 
      comments: newComments
    };
    allPosts[post.id] = updatedPost;
    storePosts(allPosts);
    setPost(updatedPost);

    setReplyingTo(null);
    setReplyContent("");
    toast({
      description: "Reply added successfully",
    });
  };

  const CommentComponent = ({ comment }: { comment: Comment }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCommentVote(comment.id, "up")}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{comment.votes}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCommentVote(comment.id, "down")}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              Posted by {comment.author} • {new Date(comment.createdAt).toLocaleDateString()}
            </p>
            <p className="mb-4">{comment.content}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyingTo(comment.id)}
              className="mb-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Reply
            </Button>

            {replyingTo === comment.id && (
              <div className="mb-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleAddReply(comment.id)}>Reply</Button>
                  <Button variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="pl-8 border-l">
                {comment.replies.map((reply) => (
                  <CommentComponent key={reply.id} comment={reply} />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <p>Loading post...</p>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <p>Post not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posted in {post.community} by {post.author}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleVote("up")}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{votes}</span>
                <Button variant="ghost" size="sm" onClick={() => handleVote("down")}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <p className="flex-1">{post.content}</p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="mb-2"
          />
          <Button onClick={handleAddComment}>Add Comment</Button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Post;
