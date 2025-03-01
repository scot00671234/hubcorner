
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch posts from API
  const fetchPostsFromApi = async () => {
    if (!communityName) return [];
    
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityName}/posts`);
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('Failed to fetch posts from API');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching ${communityName} posts:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      toast({
        title: "Failed to load posts",
        description: "Using locally stored posts instead",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Function to get posts from localStorage
  const getPostsFromLocalStorage = () => {
    if (!communityName) return [];
    
    const storedPosts = localStorage.getItem('posts');
    if (!storedPosts) return [];
    
    try {
      const localPosts = JSON.parse(storedPosts);
      return Object.values(localPosts)
        .filter((post: any) => post.community === communityName)
        .map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          community: post.community,
          votes: post.votes,
          comments: post.commentCount || post.comments || 0,
          author: post.author,
          userVoted: post.userVoted || null
        }));
    } catch (err) {
      console.error('Error parsing localStorage posts:', err);
      return [];
    }
  };

  useEffect(() => {
    if (!communityName) return;

    const loadPosts = async () => {
      // Get posts from API
      const apiPosts = await fetchPostsFromApi();
      
      // Get posts from localStorage
      const localPosts = getPostsFromLocalStorage();
      
      // Combine posts from both sources, avoiding duplicates using post ID
      const allPostsMap = new Map<string, FullPost>();
      
      // First add API posts
      apiPosts.forEach((post: any) => {
        allPostsMap.set(post.id, {
          id: post.id,
          title: post.title,
          content: post.content,
          community: post.community,
          votes: post.votes,
          comments: post.comments || 0,
          author: post.author,
          userVoted: post.userVoted || null
        });
      });
      
      // Then add localStorage posts (will override API posts with same ID)
      localPosts.forEach((post: FullPost) => {
        allPostsMap.set(post.id, post);
      });
      
      // Convert map to array
      const uniquePosts = Array.from(allPostsMap.values());
      setCommunityPosts(uniquePosts);
    };

    loadPosts();
  }, [communityName]);

  // Periodically check localStorage for updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!communityName) return;
      const localPosts = getPostsFromLocalStorage();
      
      // Check if local posts are different from current posts
      const currentPostIds = new Set(communityPosts.map(post => post.id));
      const hasNewPosts = localPosts.some(post => !currentPostIds.has(post.id));
      
      if (hasNewPosts) {
        // Update the posts with new ones from localStorage
        setCommunityPosts(prevPosts => {
          const postsMap = new Map<string, FullPost>();
          
          // Add current posts to map
          prevPosts.forEach(post => postsMap.set(post.id, post));
          
          // Update with local posts
          localPosts.forEach(post => postsMap.set(post.id, post));
          
          return Array.from(postsMap.values());
        });
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [communityName, communityPosts]);

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
          <div className="text-center py-6 text-red-500">
            <p>Error loading posts: {error}</p>
            <p className="text-gray-500 mt-2">Try refreshing the page</p>
          </div>
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
