import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!communityName) return;

    // Get posts from both props and localStorage
    const storedPosts = localStorage.getItem('posts');
    const localPosts = storedPosts ? JSON.parse(storedPosts) : {};
    
    // Filter posts by community
    const filteredPosts = Object.values(localPosts)
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

    // Combine with posts from props if they exist
    const propCommunityPosts = posts[communityName] || [];
    
    // Merge posts from both sources, avoiding duplicates using post ID
    const uniquePosts = [...propCommunityPosts, ...filteredPosts] as FullPost[];
    
    setCommunityPosts(uniquePosts);
  }, [communityName, posts]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!communityName) return;

      const storedPosts = localStorage.getItem('posts');
      const localPosts = storedPosts ? JSON.parse(storedPosts) : {};
      
      const filteredPosts = Object.values(localPosts)
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

      setCommunityPosts(filteredPosts as FullPost[]);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [communityName]);

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
        <div className="grid gap-6">
          {communityPosts.map((post) => (
            <div key={post.id} onClick={() => handlePostClick(post.id)}>
              <PostCard {...post} />
            </div>
          ))}
        </div>
        {communityPosts.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">No posts in this community yet. Be the first to post!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
