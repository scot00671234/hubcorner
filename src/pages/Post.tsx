
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Comment {
  id: string;
  content: string;
  author: string;
  votes: number;
  createdAt: string;
  replies: Comment[];
}

// Mock data - in a real app this would come from your backend
const mockPost = {
  id: "123",
  title: "The Beauty of Anonymous Discussions",
  content: "In today's digital age, anonymous discussions provide a unique space for honest dialogue. When identities are masked, people often feel more comfortable sharing their genuine thoughts and experiences.",
  author: "anonymous",
  votes: 42,
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
};

const Post = () => {
  const { postId } = useParams();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(mockPost.comments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [votes, setVotes] = useState(mockPost.votes);

  const handleVote = (direction: "up" | "down") => {
    setVotes(prev => direction === "up" ? prev + 1 : prev - 1);
    toast({
      description: `Vote ${direction === "up" ? "up" : "down"} registered`,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: "anonymous",
      votes: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments(prev => [...prev, comment]);
    setNewComment("");
    toast({
      description: "Comment added successfully",
    });
  };

  const handleAddReply = (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      content: replyContent,
      author: "anonymous",
      votes: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments(prev => prev.map(comment => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply]
        };
      }
      return comment;
    }));

    setReplyingTo(null);
    setReplyContent("");
    toast({
      description: "Reply added successfully",
    });
  };

  const Comment = ({ comment }: { comment: Comment }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleVote("up")}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{comment.votes}</span>
            <Button variant="ghost" size="sm" onClick={() => handleVote("down")}>
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
                  <Comment key={reply.id} comment={reply} />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{mockPost.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posted in {mockPost.community} by {mockPost.author}
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
              <p className="flex-1">{mockPost.content}</p>
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
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Post;
