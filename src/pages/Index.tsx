
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/post/PostCard";

const mockPosts = [
  {
    title: "The Beauty of Anonymous Discussions",
    content: "In a world where social media is increasingly tied to personal identity, there's something refreshing about purely anonymous discussions. Here's why anonymity matters in 2024...",
    community: "philosophy",
    votes: 156,
    comments: 23,
  },
  {
    title: "Tips for Meaningful Online Conversations",
    content: "Having meaningful conversations online can be challenging. Here are some proven strategies for engaging in productive discussions while maintaining anonymity...",
    community: "community",
    votes: 98,
    comments: 45,
  },
  {
    title: "The Future of Anonymous Social Platforms",
    content: "As privacy concerns grow and social media evolves, anonymous platforms are becoming increasingly important. Let's explore what the future might hold...",
    community: "technology",
    votes: 234,
    comments: 67,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trending Discussions</h1>
          <p className="text-gray-600 mt-2">Explore the most engaging conversations across communities</p>
        </header>
        <div className="grid gap-6">
          {mockPosts.map((post, index) => (
            <PostCard key={index} {...post} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
