
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
  userVoted?: 'up' | 'down' | null;
}

export function PostCard({ id, title, content, community, votes, comments, userVoted = null }: PostCardProps) {
  const navigate = useNavigate();

  // Create a preview of content
  const contentPreview = content.length > 150 ? `${content.slice(0, 150)}...` : content;

  const handleClick = () => {
    navigate(`/post/${id}`);
  };

  const handleVote = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation();
    
    // Get all posts
    const storedPosts = localStorage.getItem('posts');
    const posts = storedPosts ? JSON.parse(storedPosts) : {};
    
    // Find the post
    const post = posts[id];
    if (!post) return;
    
    let newVotes = post.votes;
    let newUserVoted = post.userVoted;
    
    // If user already voted in this direction, remove their vote
    if (post.userVoted === direction) {
      newVotes = direction === "up" ? post.votes - 1 : post.votes + 1;
      newUserVoted = null;
    } 
    // If user voted in opposite direction, change their vote (counts as 2)
    else if (post.userVoted !== null) {
      newVotes = direction === "up" ? post.votes + 2 : post.votes - 2;
      newUserVoted = direction;
    } 
    // If user hasn't voted yet, add their vote
    else {
      newVotes = direction === "up" ? post.votes + 1 : post.votes - 1;
      newUserVoted = direction;
    }
    
    // Update post
    post.votes = newVotes;
    post.userVoted = newUserVoted;
    
    // Save back to localStorage
    posts[id] = post;
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // Directly update the DOM (in a real app we'd use React state management)
    const voteElement = e.currentTarget.parentElement?.querySelector('span');
    if (voteElement) {
      voteElement.textContent = newVotes.toString();
    }
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
            <Button 
              variant={userVoted === 'up' ? "default" : "ghost"} 
              size="sm" 
              className="h-8 px-2" 
              onClick={(e) => handleVote(e, 'up')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span>{votes}</span>
            <Button 
              variant={userVoted === 'down' ? "default" : "ghost"} 
              size="sm" 
              className="h-8 px-2" 
              onClick={(e) => handleVote(e, 'down')}
            >
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
