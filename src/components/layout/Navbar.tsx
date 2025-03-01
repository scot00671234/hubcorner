
import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
        const fetchResults = async (endpoint: string) => {
          const response = await fetch(`/api/search/${endpoint}?q=${encodeURIComponent(search.trim())}`);
          if (!response.ok) {
            console.error(`Error fetching ${endpoint}:`, response.statusText);
            throw new Error(`Failed to fetch ${endpoint}`);
          }
          
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await response.json();
            } else {
              console.error(`Received non-JSON response for ${endpoint}`);
              throw new Error(`Invalid response format for ${endpoint}`);
            }
          } catch (parseError) {
            console.error(`JSON parse error for ${endpoint}:`, parseError);
            throw new Error(`Invalid response data for ${endpoint}`);
          }
        };
        
        // Use Promise.allSettled to handle partial failures
        const [postsPromise, communitiesPromise, commentsPromise] = await Promise.allSettled([
          fetchResults('posts'),
          fetchResults('communities'),
          fetchResults('comments')
        ]);
        
        const posts = postsPromise.status === 'fulfilled' ? postsPromise.value : [];
        const communities = communitiesPromise.status === 'fulfilled' ? communitiesPromise.value : [];
        const comments = commentsPromise.status === 'fulfilled' ? commentsPromise.value : [];
        
        // Check if any promises failed and show toast if needed
        const failures = [postsPromise, communitiesPromise, commentsPromise].filter(p => p.status === 'rejected');
        if (failures.length > 0) {
          // Some API calls failed, use fallback for those
          fallbackSearch(search);
          toast({
            title: "Search partially succeeded",
            description: "Some results may be using local data",
            variant: "default"
          });
        } else if (posts.length === 0 && communities.length === 0 && comments.length === 0) {
          // No results found in API, try fallback
          fallbackSearch(search);
        } else {
          // All API calls succeeded with results
          setSearchResults({
            posts,
            communities,
            comments,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Search error:', error);
        
        // Show error toast
        toast({
          title: "Search failed",
          description: "Falling back to local search",
          variant: "destructive"
        });
        
        // Fallback to client-side search if API fails
        fallbackSearch(search);
        
        setSearchResults(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }));
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
        { name: "hi", description: "Discussions about hi" },
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
