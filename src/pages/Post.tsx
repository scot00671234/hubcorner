
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

const Post = () => {
  const { postId } = useParams();
  const [comment, setComment] = useState("");

  // Mock data - would come from your backend
  const post = {
    title: "Sample Post Title",
    content: "This is a detailed post content that would be fetched from the backend based on the postId...",
    community: "technology",
    votes: 156,
    comments: [
      {
        id: 1,
        content: "Great post! Really insightful.",
        votes: 12,
        replies: [
          {
            id: 2,
            content: "I agree, very well written!",
            votes: 5,
          },
        ],
      },
    ],
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New comment:", comment);
    setComment("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="mb-6">
          <div className="flex">
            <div className="flex flex-col items-center py-4 px-2 bg-secondary">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium my-1">{post.votes}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 flex-1">
              <div className="text-sm text-muted-foreground mb-2">
                Posted in <a href={`/community/${post.community}`} className="text-accent hover:underline">{post.community}</a>
              </div>
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              <p className="text-gray-600 mb-6">{post.content}</p>
            </div>
          </div>
        </Card>

        <div className="mb-8">
          <form onSubmit={handleComment} className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="self-start">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          {post.comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{comment.votes}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">{comment.content}</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">{reply.votes}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-600">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Post;
