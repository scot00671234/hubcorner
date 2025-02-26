
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";

export interface Post {
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
}

interface CommunityProps {
  posts: { [key: string]: Post[] };
  onPostCreated: (post: Post) => void;
}

const Community = ({ posts, onPostCreated }: CommunityProps) => {
  const { communityName } = useParams();
  const communityPosts = posts[communityName || ""] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{communityName}</h1>
          <p className="text-gray-600 mt-2">Join the conversation in our {communityName} community</p>
        </header>
        <div className="mb-6">
          <CreatePostDialog onPostCreated={onPostCreated} />
        </div>
        <div className="grid gap-6">
          {communityPosts.map((post, index) => (
            <PostCard key={index} {...post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Community;
