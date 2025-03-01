
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import type { Post } from "@/pages/Community";

// This would come from your backend in a real application
const mockData = {
  posts: [
    { id: "123", title: "The Beauty of Anonymous Discussions", community: "philosophy" },
    { id: "124", title: "Tips for Meaningful Online Conversations", community: "community" },
    { id: "125", title: "The Future of Anonymous Social Platforms", community: "technology" },
  ],
  communities: [
    "philosophy",
    "technology",
    "community",
    "science",
    "art",
    "law",
    "medicine",
    "education",
  ],
  comments: [
    { id: "1", content: "Great perspective on anonymity!", postId: "123" },
    { id: "2", content: "This really helped me understand better", postId: "124" },
    { id: "3", content: "Interesting take on the future", postId: "125" },
  ],
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredPosts = search ? mockData.posts.filter((post) =>
    post.title.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const filteredCommunities = search ? mockData.communities.filter((community) =>
    community.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const filteredComments = search ? mockData.comments.filter((comment) =>
    comment.content.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Lynxier
            </a>
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search posts, comments..."
                  className="w-full pl-10 border-blue-100 focus-visible:ring-blue-400"
                  onClick={() => setOpen(true)}
                  readOnly
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CreateCommunityDialog />
            </div>
          </div>
        </div>
      </nav>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput 
            placeholder="Search posts, communities, and comments..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredPosts.length > 0 && (
              <CommandGroup heading="Posts">
                {filteredPosts.map((post) => (
                  <CommandItem
                    key={post.id}
                    onSelect={() => {
                      navigate(`/post/${post.id}`);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span>{post.title}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      in {post.community}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredCommunities.length > 0 && (
              <CommandGroup heading="Communities">
                {filteredCommunities.map((community) => (
                  <CommandItem
                    key={community}
                    onSelect={() => {
                      navigate(`/community/${community}`);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {community}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredComments.length > 0 && (
              <CommandGroup heading="Comments">
                {filteredComments.map((comment) => (
                  <CommandItem
                    key={comment.id}
                    onSelect={() => {
                      navigate(`/post/${comment.postId}`);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {comment.content}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
