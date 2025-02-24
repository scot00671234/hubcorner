
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreatePostDialog } from "@/components/post/CreatePostDialog";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-primary hover:text-accent transition-colors">
            anoniverse
          </a>
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search posts, comments..."
                className="w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <CreatePostDialog />
            <Button>Join Community</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
