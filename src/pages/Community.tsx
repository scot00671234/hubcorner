
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface Post {
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
}

interface FullPost extends Post {
  id: string;
  author: string;
  userVoted?: 'up' | 'down' | null;
}

interface CommunityProps {
  posts: { [key: string]: Post[] };
  onPostCreated: (post: Post) => void;
}

const Community = ({ posts, onPostCreated }: CommunityProps) => {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const [communityPosts, setCommunityPosts] = useState<FullPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  // Function to fetch posts from API
  const fetchPostsFromApi = async () => {
    if (!communityName) return [];
    
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityName}/posts`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API returned status ${response.status}`);
      }
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API response is not JSON');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching ${communityName} posts:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      
      // Only show toast after multiple retries
      if (retryCount > 1) {
        toast({
          title: "Failed to load posts from server",
          description: errorMessage,
          variant: "destructive"
        });
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!communityName) return;

    const loadPosts = async () => {
      // Get posts from API
      const apiPosts = await fetchPostsFromApi();
      
      if (apiPosts.length > 0) {
        setCommunityPosts(apiPosts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          community: post.community,
          votes: post.votes || 0,
          comments: post.comments || 0,
          author: post.author || 'anonymous',
          userVoted: post.userVoted || null
        })));
        setError(null);
      } else if (retryCount < 3) {
        // Retry up to 3 times with increasing delays
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    };

    loadPosts();
  }, [communityName, retryCount]);

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const handlePostCreated = (post: Post) => {
    // Update the component state with the new post
    if ('id' in post && 'author' in post) {
      setCommunityPosts((prev) => [...prev, post as FullPost]);
    }
    
    // Call the parent onPostCreated function
    onPostCreated(post);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{communityName}</h1>
          <p className="text-gray-600 mt-2">Join the conversation in our {communityName} community</p>
        </header>
        <div className="mb-6">
          <CreatePostDialog onPostCreated={handlePostCreated} />
        </div>
        
        {loading && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-500 mt-2">Loading posts...</p>
          </div>
        )}
        
        {error && !loading && communityPosts.length === 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>Failed to load posts from server: {error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        {!loading && communityPosts.length > 0 && (
          <div className="grid gap-6">
            {communityPosts.map((post) => (
              <div key={post.id} onClick={() => handlePostClick(post.id)} className="cursor-pointer">
                <PostCard {...post} />
              </div>
            ))}
          </div>
        )}
        
        {!loading && communityPosts.length === 0 && !error && (
          <div className="text-center py-6">
            <p className="text-gray-500">No posts in this community yet. Be the first to post!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
