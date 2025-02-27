
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
}

export function PostCard({ id, title, content, community, votes, comments }: PostCardProps) {
  const navigate = useNavigate();

  // Create a preview of content
  const contentPreview = content.length > 150 ? `${content.slice(0, 150)}...` : content;

  const handleClick = () => {
    navigate(`/post/${id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posted in {community}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">{contentPreview}</p>
        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => e.stopPropagation()}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span>{votes}</span>
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => e.stopPropagation()}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{comments}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
