
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Post } from "@/pages/Community";

// Extended list of communities for better search demonstration
const communities = [
  "philosophy",
  "technology",
  "community",
  "science",
  "art",
  "law",
  "medicine",
  "education",
  "politics",
  "gaming"
];

interface CreatePostDialogProps {
  onPostCreated?: (post: Post) => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(communityName || "");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCommunities = communities.filter((community) =>
    community.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value) {
      toast.error("Please select a community");
      return;
    }
    
    const newPost: Post = {
      title,
      content,
      community: value,
      votes: 0,
      comments: 0
    };
    
    // Call the onPostCreated callback if it exists
    if (onPostCreated) {
      onPostCreated(newPost);
    }
    
    // Show success message
    toast.success("Post created successfully!");
    
    // Close the dialog
    setDialogOpen(false);
    
    // Reset form
    setTitle("");
    setContent("");
    setValue(communityName || "");
    setSearch("");
    
    // Navigate to the community where the post was created
    navigate(`/community/${value}`);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Create Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {value || "Select community..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search community..." 
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No community found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCommunities.map((community) => (
                        <CommandItem
                          key={community}
                          onSelect={() => {
                            setValue(community);
                            setSearch("");
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === community ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {community}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[200px]"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Post</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
