import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Users, Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    name: string;
  };
  commentCount?: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
  };
}

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (slug) {
      fetchCommunityData();
    }
  }, [slug, user]);

  const fetchCommunityData = async () => {
    try {
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Check if user is a member
      if (user) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', communityData.id)
          .eq('user_id', user.id)
          .single();

        if (!memberData) {
          toast.error('You must join this community to view posts');
          navigate('/communities');
          return;
        }
      } else {
        navigate('/auth');
        return;
      }

      fetchPosts(communityData.id);
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Failed to load community');
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (communityId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-community-feed', {
        body: { communityId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      const postsFormatted = data.data.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        author: { name: post.author_name },
        commentCount: post.comment_count
      }));

      setPosts(postsFormatted);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load community posts');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle,
          content: newPostContent,
          author_id: user.id,
          community_id: community.id,
          type: 'update'
        });

      if (error) throw error;

      toast.success('Post created successfully!');
      setNewPostTitle("");
      setNewPostContent("");
      fetchPosts(community.id);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: { name: profileData?.name || 'Unknown' }
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handlePostClick = (postId: string) => {
    setSelectedPost(postId === selectedPost ? null : postId);
    if (postId !== selectedPost) {
      fetchComments(postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          user_id: user.id,
          post_id: postId
        });

      if (error) throw error;

      toast.success('Comment added!');
      setNewComment("");
      fetchComments(postId);
      if (community) fetchPosts(community.id);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{community?.name}</h1>
              <p className="text-muted-foreground">{community?.description}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl shadow-card border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Create Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  placeholder="Post title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                  rows={3}
                />
                <Button type="submit" className="gap-2">
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Posts</h2>
              {posts.length === 0 ? (
                <div className="bg-card rounded-xl shadow-card border p-8 text-center text-muted-foreground">
                  No posts yet. Be the first to post!
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-card rounded-xl shadow-card border p-6">
                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    <p className="text-muted-foreground mb-4">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>by {post.author?.name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.commentCount} Comments
                    </Button>

                    {selectedPost === post.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-muted rounded-lg p-3">
                              <p className="text-sm mb-1">{comment.content}</p>
                              <span className="text-xs text-muted-foreground">
                                {comment.profiles?.name} • {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)}>
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-card border p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Community Info</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Connect with community members, share your thoughts, and engage in discussions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
