
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  community: string;
  votes: number;
  comments: number;
  userVoted?: 'up' | 'down' | null;
}

export function PostCard({ id, title, content, community, votes: initialVotes, comments, userVoted: initialUserVoted = null }: PostCardProps) {
  const navigate = useNavigate();
  const [votes, setVotes] = useState(initialVotes);
  const [userVoted, setUserVoted] = useState(initialUserVoted);
  const [isVoting, setIsVoting] = useState(false);

  // Create a preview of content
  const contentPreview = content.length > 150 ? `${content.slice(0, 150)}...` : content;

  const handleClick = () => {
    navigate(`/post/${id}`);
  };

  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    navigate(`/community/${community}`);
  };

  const handleVote = async (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation();
    
    if (isVoting) return;
    
    setIsVoting(true);
    
    try {
      // Try to call the backend API to vote
      let apiSuccess = false;
      let updatedPost;
      
      try {
        const response = await fetch(`/api/posts/${id}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: 'anonymous', // In a real app, this would be the user ID
            vote_type: direction
          }),
        });
        
        if (response.ok) {
          updatedPost = await response.json();
          apiSuccess = true;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // We'll handle with localStorage fallback
      }
      
      // Fallback to localStorage if API call fails
      if (!apiSuccess) {
        // Calculate new vote count and user's vote state
        let newVotes = votes;
        let newUserVoted = userVoted;
        
        // If user already voted in this direction, remove their vote
        if (userVoted === direction) {
          newVotes = direction === "up" ? votes - 1 : votes + 1;
          newUserVoted = null;
        } 
        // If user voted in opposite direction, change their vote (counts as 2)
        else if (userVoted !== null) {
          newVotes = direction === "up" ? votes + 2 : votes - 2;
          newUserVoted = direction;
        } 
        // If user hasn't voted yet, add their vote
        else {
          newVotes = direction === "up" ? votes + 1 : votes - 1;
          newUserVoted = direction;
        }
        
        // Update localStorage
        const storedPosts = localStorage.getItem('posts');
        const posts = storedPosts ? JSON.parse(storedPosts) : {};
        
        if (posts[id]) {
          posts[id].votes = newVotes;
          posts[id].userVoted = newUserVoted;
          localStorage.setItem('posts', JSON.stringify(posts));
          
          // For debugging
          console.log(`Post ${id} synchronized with updated data`);
        }
        
        updatedPost = {
          votes: newVotes,
          userVoted: newUserVoted
        };
      }
      
      // Update UI with new vote counts
      setVotes(updatedPost.votes);
      setUserVoted(updatedPost.userVoted);
      
    } catch (error) {
      console.error('Error voting on post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote on post",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow card-gradient border border-blue-100" onClick={handleClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-blue-800">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posted in <button 
                className="text-blue-500 hover:underline font-medium"
                onClick={handleCommunityClick}
              >{community}</button>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-blue-900 mb-4">{contentPreview}</p>
        <div className="flex items-center gap-4 text-blue-600">
          <div className="flex items-center gap-1">
            <Button 
              variant={userVoted === 'up' ? "default" : "ghost"} 
              size="sm" 
              className={`h-8 px-2 ${userVoted === 'up' ? 'bg-blue-500 text-white' : ''}`}
              onClick={(e) => handleVote(e, 'up')}
              disabled={isVoting}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span>{votes}</span>
            <Button 
              variant={userVoted === 'down' ? "default" : "ghost"} 
              size="sm" 
              className={`h-8 px-2 ${userVoted === 'down' ? 'bg-blue-500 text-white' : ''}`}
              onClick={(e) => handleVote(e, 'down')}
              disabled={isVoting}
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
