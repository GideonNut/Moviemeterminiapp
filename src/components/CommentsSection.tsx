"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/textarea";
import { MessageCircle, Heart, Reply, Send, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";

interface Reply {
  address: string;
  content: string;
  timestamp: string;
  likes: string[];
}

interface Comment {
  _id: string;
  movieId: string;
  address: string;
  content: string;
  timestamp: string;
  likes: string[];
  replies: Reply[];
}

interface CommentsSectionProps {
  movieId: string;
  isTVShow?: boolean;
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function CommentsSection({ movieId }: CommentsSectionProps) {
  const { address, isConnected } = useAccount();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [liking, setLiking] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?movieId=${movieId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!isConnected || !address || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          movieId,
          address,
          content: newComment.trim()
        })
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(); // Refresh comments
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isConnected || !address) return;

    try {
      setLiking(commentId);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          commentId,
          address
        })
      });

      if (response.ok) {
        // Update local state
        setComments(prev => prev.map(comment => {
          if (comment._id === commentId) {
            const hasLiked = comment.likes.includes(address);
            return {
              ...comment,
              likes: hasLiked 
                ? comment.likes.filter(addr => addr !== address)
                : [...comment.likes, address]
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLiking(null);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!isConnected || !address || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          commentId,
          address,
          content: replyContent.trim()
        })
      });

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchComments(); // Refresh comments
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?movieId=${movieId}`);
        if (response.ok && mounted) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadComments();

    // Cleanup function
    return () => {
      mounted = false;
      setComments([]);
      setLoading(true);
    };
  }, [movieId]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <MessageCircle size={24} />
        Comments ({comments.length})
      </h2>

      {/* Add Comment Form */}
      {isConnected ? (
        <Card className="bg-[#18181B] border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {formatAddress(address!)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this movie..."
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/40">
                      {newComment.length}/1000 characters
                    </span>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {submitting ? (
                        <RefreshCw size={16} className="animate-spin mr-2" />
                      ) : (
                        <Send size={16} className="mr-2" />
                      )}
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#18181B] border-white/10 mb-6">
          <CardContent className="p-6 text-center">
            <MessageCircle size={48} className="text-white/40 mx-auto mb-3" />
            <p className="text-white/60 mb-2">Connect your wallet to join the discussion</p>
            <p className="text-xs text-white/40">Share your thoughts about this movie with other viewers</p>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-white/60 mr-2" />
          <span className="text-white/60">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <Card className="bg-[#18181B] border-white/10">
          <CardContent className="p-8 text-center">
            <MessageCircle size={48} className="text-white/40 mx-auto mb-3" />
            <p className="text-white/60 mb-2">No comments yet</p>
            <p className="text-xs text-white/40">Be the first to share your thoughts about this movie!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment._id} className="bg-[#18181B] border-white/10">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Comment Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {formatAddress(comment.address)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {formatAddress(comment.address)}
                        </span>
                        <span className="text-xs text-white/40">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 ml-11">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment._id)}
                      disabled={!isConnected || liking === comment._id}
                      className={`p-1 h-auto text-xs ${
                        comment.likes.includes(address || '') 
                          ? 'text-red-400 hover:text-red-300' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {liking === comment._id ? (
                        <RefreshCw size={14} className="animate-spin mr-1" />
                      ) : (
                        <Heart size={14} className="mr-1" />
                      )}
                      {comment.likes.length}
                    </Button>

                    {isConnected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        className="p-1 h-auto text-xs text-white/60 hover:text-white"
                      >
                        <Reply size={14} className="mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <div className="ml-11 mt-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {formatAddress(address!)[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            maxLength={500}
                            className="text-sm"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-white/40">
                              {replyContent.length}/500
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }}
                                className="text-xs px-2 py-1 h-auto"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleAddReply(comment._id)}
                                disabled={!replyContent.trim() || submitting}
                                size="sm"
                                className="text-xs px-2 py-1 h-auto bg-purple-600 hover:bg-purple-700"
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3 pt-3 border-t border-white/5">
                      {comment.replies.map((reply, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {formatAddress(reply.address)[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-white">
                                {formatAddress(reply.address)}
                              </span>
                              <span className="text-xs text-white/40">
                                {formatTime(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-white/90 text-xs leading-relaxed break-words">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}