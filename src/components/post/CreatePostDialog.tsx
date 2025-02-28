
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { Post } from "@/pages/Community";

interface CreatePostDialogProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please enter both a title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the community name from URL
      const communityName = window.location.pathname.split('/').pop() || "";

      // Create a post data
      const postData = {
        id: Date.now().toString(),
        title,
        content,
        community: communityName,
        author: "anonymous"
      };

      // Try to send post to backend API
      let createdPost;
      let apiSuccess = false;
      
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          createdPost = await response.json();
          apiSuccess = true;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // We'll handle this in the fallback below
      }
      
      // If API fails, use localStorage fallback
      if (!apiSuccess) {
        // Get existing posts
        const storedPosts = localStorage.getItem('posts');
        const existingPosts = storedPosts ? JSON.parse(storedPosts) : {};
        
        // Add the new post with comments array
        const newPost = {
          ...postData,
          votes: 0,
          commentCount: 0,
          comments: [],
          created_at: new Date().toISOString()
        };
        
        // Store in localStorage
        existingPosts[postData.id] = newPost;
        localStorage.setItem('posts', JSON.stringify(existingPosts));
        
        createdPost = newPost;
        
        console.log('Created post in localStorage:', newPost);
      }

      // Convert to frontend Post type
      const frontendPost: Post & { id: string, author: string } = {
        id: createdPost.id,
        title: createdPost.title,
        content: createdPost.content,
        community: createdPost.community,
        votes: createdPost.votes || 0,
        comments: createdPost.comments || 0,
        author: createdPost.author || 'anonymous'
      };

      onPostCreated(frontendPost);
      setTitle("");
      setContent("");
      setOpen(false);

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      // Navigate to the new post
      navigate(`/post/${createdPost.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content" className="text-right">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
