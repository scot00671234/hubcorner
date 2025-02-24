
import { ArrowUp, ArrowDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PostCardProps {
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
}

export function PostCard({ title, content, community, votes, comments }: PostCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in">
      <div className="flex">
        <div className="flex flex-col items-center py-4 px-2 bg-secondary">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium my-1">{votes}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 flex-1">
          <div className="text-sm text-muted-foreground mb-2">
            Posted in <Link to={`/community/${community}`} className="text-accent hover:underline">{community}</Link>
          </div>
          <Link to={`/post/123`} className="block group">
            <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">{title}</h3>
            <p className="text-gray-600 line-clamp-3 mb-4">{content}</p>
          </Link>
          <div className="flex items-center text-sm text-gray-500">
            <Button variant="ghost" size="sm" className="hover:text-accent">
              <MessageCircle className="h-4 w-4 mr-2" />
              {comments} Comments
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
