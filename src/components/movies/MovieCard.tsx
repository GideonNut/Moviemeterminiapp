import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "../ui/Button";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { ensureFullPosterUrl } from "~/lib/images/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "../icons";

interface Movie {
  id: string;
  title: string;
  description: string;
  releaseYear?: string;
  director?: string;
  cast?: string[];
  genres?: string[];
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  screenshots?: string[];
  votes?: {
    yes: number;
    no: number;
  };
  commentCount?: number;
  _id?: string; // Added _id to the interface
}

interface MovieCardProps {
  movie: Movie;
  onVote: (vote: boolean) => void;
  isVoting: boolean;
  isConnected: boolean;
  userVotes?: { [id: string]: 'yes' | 'no' | null };
}

// Compact version for carousel display
export function CompactMovieCard({ movie, onVote, isConnected, userVotes }: MovieCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);
  
  const handleVote = async (vote: boolean) => {
    const movieId = movie.id || movie._id;
    if (!movieId) {
      const errorMsg = 'No movie ID found in movie object';
      console.error(errorMsg, movie);
      alert(errorMsg);
      return;
    }
    
    // Get the current session
    const currentSession = await fetch('/api/auth/session').then(res => res.json());
    
    if (!currentSession?.user?.fid) {
      const errorMsg = 'User not authenticated with Farcaster. Please sign in.';
      console.error(errorMsg);
      alert(errorMsg);
      // Redirect to sign-in or trigger sign-in flow
      window.location.href = '/signin';
      return;
    }

    console.log('Initiating vote for movie:', {
      movieId,
      movieTitle: movie.title,
      vote: vote ? 'yes' : 'no',
      fid: currentSession.user.fid
    });
    
    setIsVoting(true);
    
    try {
      const voteData = { 
        action: "vote", 
        id: movieId, 
        type: vote ? "yes" : "no"
      };
      
      console.log('Sending vote request:', voteData);
      
      // Get the session token
      const sessionToken = await fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => data.accessToken)
        .catch(err => {
          console.error('Error getting session token:', err);
          return null;
        });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add the session token to the headers if available
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch("/api/movies", {
        method: "POST",
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(voteData),
      });
      
      const result = await response.json();
      console.log('Vote response:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      
      if (response.ok) {
        console.log('Vote successful, calling onVote callback');
        onVote(vote);
      } else {
        const errorMsg = result.error || `Vote failed with status ${response.status}`;
        console.error('Vote failed:', errorMsg);
        alert(`Vote failed: ${errorMsg}`);
        // Show error to user
        alert(result.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('An error occurred while submitting your vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleClick = () => {
    router.push('/movies');
  };

  // Check if user has voted on this movie
  const movieId = movie.id || movie._id;
  const userVote = movieId ? userVotes?.[movieId] : null;
  const hasVoted = !!userVote;

  // Ensure poster URL is a full URL
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;

  return (
    <div 
      onClick={handleClick}
      className={`group relative overflow-hidden p-1.5 px-3 pt-3 rounded-t-[16px] rounded-b-[24px] border ${hasVoted ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 ring-primary'} bg-[#141414]  shadow-lg transition-all duration-300 hover:border-white/20 flex flex-col w-full max-w-[280px] ${hasVoted ? 'ring-1 ring-green-500/20' : ''} cursor-pointer`}>
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full rounded-[18px]  overflow-hidden">
        {fullPosterUrl ? (
          <Image
            src={fullPosterUrl}
            alt={movie.title}
            width={280}
            height={420}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Poster</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Movie Info */}
      <div className="flex-1 flex flex-col justify-between p-4 px-0">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-white line-clamp-1 flex-1 min-w-0">{movie.title}</h3>
            <span className="text-xs text-white/60 flex-shrink-0">{movie.releaseYear || 'N/A'}</span>
          </div>
          <p className="mb-3 text-xs text-white/70 line-clamp-2">{movie.description}</p>
          {movie.genres && (
            <div className="mb-3 flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60 truncate max-w-[120px]"
                  title={genre}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Vote and Comment Counts */}
        <div className="mb-3 flex items-center justify-between text-xs mt-2">
          <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
            <span className="whitespace-nowrap">Yes: {movie.votes?.yes || 0}</span>
            <span className="whitespace-nowrap">No: {movie.votes?.no || 0}</span>
            <span className="whitespace-nowrap pl-2 border-l border-white/10">💬 {movie.commentCount || 0}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white/60">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* Vote Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={userVote === 'yes' ? 'default' : 'outline'}
            size="sm"
            className={"flex-1 text-xs py-1.5 ring-primary"}
            onClick={() => {
              console.log('Yes button clicked!');
              handleVote(true);
            }}
            disabled={!isConnected || isVoting || hasVoted}
          >
            <div className={`relative flex items-center gap-1 ${userVote === 'yes' ? 'animate-pulse' : ''}`}>
              <div className="relative">
                <ThumbsUpIcon size={18} />
                {userVote === 'yes' && (
                  <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                )}
              </div>
              <span className="truncate">{isVoting ? 'Voting...' : userVote === 'yes' ? 'Voted Yes' : 'Yes'}</span>
            </div>
          </Button>
          <Button
            variant={userVote === 'no' ? 'default' : 'outline'}
            size="sm"
            className={"flex-1 text-xs py-1.5"}
            onClick={() => {
              console.log('No button clicked!');
              handleVote(false);
            }}
            disabled={!isConnected || isVoting || hasVoted}
          >
            <div className={`relative flex items-center gap-1 ${userVote === 'no' ? 'animate-pulse' : ''}`}>
              <div className="relative">
                <ThumbsDownIcon size={18} />
                {userVote === 'no' && (
                  <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                )}
              </div>
              <span className="truncate">{isVoting ? 'Voting...' : userVote === 'no' ? 'Voted No' : 'No'}</span>
            </div>
          </Button>
        </div>
        {/* We don't show the "already voted" message here anymore */}
      </div>
    </div>
  );
}

export function MovieCard({ movie, onVote, isConnected, userVotes }: MovieCardProps) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: boolean) => {
    const movieId = movie.id || movie._id;
    if (!movieId) {
      console.error('No movie ID found:', movie);
      return;
    }
    
    if (!session?.user?.fid) {
      console.error('User not authenticated with Farcaster');
      // You might want to trigger a sign-in flow here
      return;
    }

    console.log('Voting on movie:', movieId, 'with vote:', vote);
    setIsVoting(true);
    
    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important for sending cookies with the request
        body: JSON.stringify({ 
          action: "vote", 
          id: movieId, 
          type: vote ? "yes" : "no"
          // No need to send userAddress as it will be taken from the session
        }),
      });
      
      const result = await response.json();
      console.log('Vote response:', result);
      
      if (response.ok) {
        onVote(vote);
      } else {
        console.error('Vote failed:', result.error);
        // Show error to user
        alert(result.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('An error occurred while submitting your vote');
    } finally {
      setIsVoting(false);
    }
  };

  // Check if user has voted on this movie
  const movieId = movie.id || movie._id;
  const userVote = movieId ? userVotes?.[movieId] : null;
  const hasVoted = !!userVote;

  // Ensure poster URL is a full URL
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${hasVoted ? 'border-green-500/30 bg-green-500/5' : 'border-white/10'} bg-[#23232B] shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col ${hasVoted ? 'ring-1 ring-green-500/20' : ''}`}>
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {fullPosterUrl ? (
          <Image
            src={fullPosterUrl}
            alt={movie.title}
            width={300}
            height={450}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Poster</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Movie Info */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white line-clamp-1 flex-1 min-w-0">{movie.title}</h3>
            <span className="text-sm text-white/60 flex-shrink-0">{movie.releaseYear || 'N/A'}</span>
          </div>
          <p className="mb-4 text-sm text-white/70 line-clamp-2">{movie.description}</p>
          {movie.genres && (
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60 truncate max-w-[150px]"
                  title={genre}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Vote Counts */}
        <div className="mb-4 flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
            <span className="whitespace-nowrap">Yes: {movie.votes?.yes || 0}</span>
            <span className="whitespace-nowrap">No: {movie.votes?.no || 0}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white/60">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* Vote Buttons */}
        <div className="flex gap-3 mt-2">
          <Button
            variant={userVote === 'yes' ? 'default' : 'outline'}
            className={"flex-1"}
            onClick={() => handleVote(true)}
            disabled={!isConnected || isVoting || hasVoted}
          >
            <div className={`relative flex items-center gap-2 ${userVote === 'yes' ? 'animate-pulse' : ''}`}>
              <div className="relative">
               <ThumbsUpIcon size={18} />
                {userVote === 'yes' && (
                  <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                )}
              </div>
              <span className="truncate">{userVote === 'yes' ? 'Voted Yes' : 'Yes'}</span>
            </div>
          </Button>
          <Button
            variant={userVote === 'no' ? 'default' : 'outline'}
            className={"flex-1"}
            onClick={() => handleVote(false)}
            disabled={!isConnected || isVoting || hasVoted}
          >
            <div className={`relative flex items-center gap-2 ${userVote === 'no' ? 'animate-pulse' : ''}`}>
              <div className="relative">
                <ThumbsDownIcon size={18} />
                {userVote === 'no' && (
                  <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                )}
              </div>
              <span className="truncate">{userVote === 'no' ? 'Voted No' : 'No'}</span>
            </div>
          </Button>
        </div>
        {hasVoted && (
          <div className="text-center mt-3">
            <span className="text-sm font-medium bg-accent text-accent-foreground px-3 py-1 rounded-full">You've voted already on this movie</span>
          </div>
        )}
      </div>
    </div>
  );
}