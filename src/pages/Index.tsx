
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
  author: string;
  userVoted?: 'up' | 'down' | null;
}

const Index = () => {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Function to load posts from localStorage
    const loadPosts = () => {
      const storedPosts = localStorage.getItem('posts');
      const postsData = storedPosts ? JSON.parse(storedPosts) : {};
      
      // Convert to array and sort
      const postsArray = Object.values(postsData) as Post[];
      
      // Sort by votes (trending)
      const sortedByVotes = [...postsArray].sort((a, b) => b.votes - a.votes);
      
      // Sort by creation date (newest first, using id as proxy for timestamp)
      const sortedByNewest = [...postsArray].sort((a, b) => 
        parseInt(b.id) - parseInt(a.id)
      );
      
      setTrendingPosts(sortedByVotes.slice(0, 5)); // Top 5 trending posts
      setNewPosts(sortedByNewest.slice(0, 5));     // 5 newest posts
    };

    // Load posts immediately
    loadPosts();
    
    // Set up interval to refresh posts
    const intervalId = setInterval(loadPosts, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to anoniverse</h1>
          <p className="text-gray-600 mt-2">
            A place for anonymous discussions. Explore communities and share your thoughts freely.
          </p>
        </header>
        
        {(trendingPosts.length > 0 || newPosts.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trending Posts */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <ArrowUp className="mr-2 text-green-500" /> Trending Posts
              </h2>
              <div className="space-y-4">
                {trendingPosts.length > 0 ? (
                  trendingPosts.map(post => (
                    <div key={post.id} onClick={() => handlePostClick(post.id)}>
                      <PostCard {...post} />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No trending posts yet.</p>
                )}
              </div>
            </div>
            
            {/* New Posts */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <ArrowDown className="mr-2 text-blue-500" /> New Posts
              </h2>
              <div className="space-y-4">
                {newPosts.length > 0 ? (
                  newPosts.map(post => (
                    <div key={post.id} onClick={() => handlePostClick(post.id)}>
                      <PostCard {...post} />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No new posts yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No posts available yet. Start exploring communities or create your first post!</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => navigate('/community/philosophy')}
              >
                Explore Philosophy
              </button>
              <button 
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                onClick={() => navigate('/community/technology')}
              >
                Explore Technology
              </button>
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                onClick={() => navigate('/community/gaming')}
              >
                Explore Gaming
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
