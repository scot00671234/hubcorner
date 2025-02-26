
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import Community from "./pages/Community";
import Post from "./pages/Post";
import NotFound from "./pages/NotFound";
import type { Post as PostType } from "./pages/Community";

const queryClient = new QueryClient();

const App = () => {
  const [posts, setPosts] = useState<{ [key: string]: PostType[] }>({});

  const handleNewPost = (post: PostType) => {
    setPosts(prevPosts => ({
      ...prevPosts,
      [post.community]: [...(prevPosts[post.community] || []), post]
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index onPostCreated={handleNewPost} />} />
            <Route 
              path="/community/:communityName" 
              element={<Community 
                posts={posts} 
                onPostCreated={handleNewPost} 
              />} 
            />
            <Route 
              path="/post/:postId" 
              element={<Post onPostCreated={handleNewPost} />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
