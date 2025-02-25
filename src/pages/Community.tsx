
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";
import { useState } from "react";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";

export interface Post {
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
}

const Community = () => {
  const { communityName } = useParams();
  const [posts, setPosts] = useState<Post[]>([
    {
      title: "Welcome to " + communityName,
      content: "This is the official welcome post for our community. Please read our guidelines and enjoy your stay!",
      community: communityName || "",
      votes: 42,
      comments: 15,
    },
    {
      title: "Best practices for posting in " + communityName,
      content: "Here are some tips and best practices for making great posts in our community...",
      community: communityName || "",
      votes: 28,
      comments: 8,
    },
  ]);

  const handleNewPost = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
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
          <CreatePostDialog onPostCreated={handleNewPost} />
        </div>
        <div className="grid gap-6">
          {posts.map((post, index) => (
            <PostCard key={index} {...post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Community;
