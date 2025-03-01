
import { useState, useEffect } from "react";
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

// Types for search results
interface SearchableCommunity {
  name: string;
  description: string;
}

interface SearchablePost {
  id: string;
  title: string;
  community: string;
}

interface SearchableComment {
  id: string;
  content: string;
  postId: string;
}

interface SearchState {
  posts: SearchablePost[];
  communities: SearchableCommunity[];
  comments: SearchableComment[];
  isLoading: boolean;
  error: string | null;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchState>({
    posts: [],
    communities: [],
    comments: [],
    isLoading: false,
    error: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch search results when the search dialog is open and we have a search term
    if (!open || !search.trim()) {
      setSearchResults(prev => ({
        ...prev,
        posts: [],
        communities: [],
        comments: [],
        isLoading: false,
        error: null
      }));
      return;
    }

    // Debounce search to avoid excessive API calls
    const handler = setTimeout(async () => {
      setSearchResults(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Fetch posts that match the search term
        const postsResponse = await fetch(`/api/search/posts?q=${encodeURIComponent(search.trim())}`);
        if (!postsResponse.ok) throw new Error('Failed to fetch posts');
        const posts = await postsResponse.json();
        
        // Fetch communities that match the search term
        const communitiesResponse = await fetch(`/api/search/communities?q=${encodeURIComponent(search.trim())}`);
        if (!communitiesResponse.ok) throw new Error('Failed to fetch communities');
        const communities = await communitiesResponse.json();
        
        // Fetch comments that match the search term
        const commentsResponse = await fetch(`/api/search/comments?q=${encodeURIComponent(search.trim())}`);
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
        const comments = await commentsResponse.json();
        
        setSearchResults({
          posts,
          communities,
          comments,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }));
        
        // Fallback to client-side search if API fails
        fallbackSearch(search);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [search, open]);

  // Fallback search function that searches locally if API fails
  const fallbackSearch = (query: string) => {
    if (!query.trim()) return;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // This would ideally come from a client-side cache
    // For now, we'll use this mock data as a fallback
    const mockData = {
      posts: [
        { id: "123", title: "The Beauty of Anonymous Discussions", community: "philosophy" },
        { id: "124", title: "Tips for Meaningful Online Conversations", community: "community" },
        { id: "125", title: "The Future of Anonymous Social Platforms", community: "technology" },
      ],
      communities: [
        { name: "philosophy", description: "Discuss philosophical topics and ideas" },
        { name: "technology", description: "Share and learn about the latest in tech" },
        { name: "community", description: "Community building and social discourse" },
        { name: "science", description: "Scientific discoveries and discussions" },
        { name: "art", description: "Share and appreciate art in all forms" },
        { name: "law", description: "Legal discussions and advice" },
        { name: "medicine", description: "Medical discussions and health advice" },
        { name: "education", description: "Topics related to learning and teaching" },
      ],
      comments: [
        { id: "1", content: "Great perspective on anonymity!", postId: "123" },
        { id: "2", content: "This really helped me understand better", postId: "124" },
        { id: "3", content: "Interesting take on the future", postId: "125" },
      ],
    };
    
    const filteredPosts = mockData.posts.filter(post => 
      post.title.toLowerCase().includes(normalizedQuery) || 
      post.community.toLowerCase().includes(normalizedQuery)
    );
    
    const filteredCommunities = mockData.communities.filter(community => 
      community.name.toLowerCase().includes(normalizedQuery) ||
      community.description.toLowerCase().includes(normalizedQuery)
    );
    
    const filteredComments = mockData.comments.filter(comment => 
      comment.content.toLowerCase().includes(normalizedQuery)
    );
    
    setSearchResults({
      posts: filteredPosts,
      communities: filteredCommunities,
      comments: filteredComments,
      isLoading: false,
      error: 'Using fallback search due to API error'
    });
  };

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
                  placeholder="Search posts, communities, comments..."
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
            {searchResults.isLoading ? (
              <div className="py-6 text-center text-sm">
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Searching...
              </div>
            ) : searchResults.error && !searchResults.error.includes('fallback') ? (
              <div className="py-6 text-center text-sm text-red-500">
                Error: {searchResults.error}
              </div>
            ) : (
              <>
                {!search.trim() ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Start typing to search...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No results found for "{search}".</CommandEmpty>
                    
                    {searchResults.posts.length > 0 && (
                      <CommandGroup heading="Posts">
                        {searchResults.posts.map((post) => (
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
                    
                    {searchResults.communities.length > 0 && (
                      <CommandGroup heading="Communities">
                        {searchResults.communities.map((community) => (
                          <CommandItem
                            key={community.name}
                            onSelect={() => {
                              navigate(`/community/${community.name}`);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <span className="font-medium">{community.name}</span>
                            {community.description && (
                              <span className="ml-2 text-sm text-muted-foreground truncate max-w-[200px]">
                                {community.description}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {searchResults.comments.length > 0 && (
                      <CommandGroup heading="Comments">
                        {searchResults.comments.map((comment) => (
                          <CommandItem
                            key={comment.id}
                            onSelect={() => {
                              navigate(`/post/${comment.postId}`);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <span className="truncate max-w-[300px]">{comment.content}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {searchResults.error?.includes('fallback') && (
                      <div className="p-2 text-xs text-amber-600 bg-amber-50 rounded-sm mx-2 my-1">
                        Using local search results. Some data may not be current.
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
