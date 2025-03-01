
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export function CreateCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a community name.",
        variant: "destructive",
      });
      return;
    }

    // Validate community name format (lowercase, no spaces, etc.)
    if (!/^[a-z0-9-]+$/.test(name)) {
      toast({
        title: "Error",
        description: "Community name can only contain lowercase letters, numbers, and hyphens.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Try to send community to backend API
      let apiSuccess = false;
      
      try {
        const response = await fetch('/api/communities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description: description.trim() || `Discussions about ${name}`,
          }),
        });

        if (response.ok) {
          apiSuccess = true;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // We'll handle this in the fallback below
      }
      
      // If API fails, use localStorage fallback
      if (!apiSuccess) {
        // Get existing communities
        const storedCommunities = localStorage.getItem('communities');
        const communities = storedCommunities ? JSON.parse(storedCommunities) : [];
        
        // Check if community already exists
        if (communities.some(c => c.name === name)) {
          toast({
            title: "Error",
            description: "A community with this name already exists.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Add the new community
        const newCommunity = {
          name,
          description: description.trim() || `Discussions about ${name}`,
          created_at: new Date().toISOString()
        };
        
        communities.push(newCommunity);
        localStorage.setItem('communities', JSON.stringify(communities));
        
        console.log('Created community in localStorage:', newCommunity);
      }

      setName("");
      setDescription("");
      setOpen(false);

      toast({
        title: "Success",
        description: "Community created successfully!",
      });

      // Redirect to the new community page
      window.location.href = `/community/${name}`;
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Community</DialogTitle>
          <DialogDescription>
            Start a new space for discussion on a specific topic
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="community-name" className="text-right">
              Name
            </Label>
            <div className="col-span-3">
              <Input
                id="community-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                className="col-span-3"
                placeholder="technology"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="community-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="community-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              rows={3}
              placeholder="What is this community about?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Community"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
