import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, MessageCircle, Plus, Search, Filter, Trash2, Edit, Crown, ThumbsUp, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';

interface CommunityPost {
  id: number;
  userId: number;
  title?: string;
  content: string;
  category: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  authorName: string;
  authorEmail: string;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
}

export default function CommunityFeed() {
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Domande' });
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutte');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('');
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Fetch community posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/community/posts'],
    queryFn: async () => {
      const response = await fetch('/api/community/posts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Check if current user is admin
  const isAdmin = userData?.email === 'alessio@gmail.com';

  // Function to check if post can be edited/deleted
  const canEditPost = (post: any) => {
    if (isAdmin) return true;
    if (post.userId !== userData?.id) return false;

    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    return diffMinutes <= 30;
  };

  // Function to get user role display
  const getUserRole = (email: string) => {
    return email === 'alessio@gmail.com' ? 'Coach' : 'Studente';
  };

  const { data: comments = [] } = useQuery({
    queryKey: ['community-comments', selectedPost],
    queryFn: () => selectedPost ? fetch(`/api/community/posts/${selectedPost}/comments`).then(res => res.json()) : [],
    enabled: !!selectedPost
  });

  const createPostMutation = useMutation({
    mutationFn: (post: any) => apiRequest('POST', '/api/community/posts', post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.refetchQueries({ queryKey: ['community-posts'] });
      setNewPost({ title: '', content: '', category: 'Domande' });
      setShowNewPost(false);
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      apiRequest('POST', `/api/community/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-comments', selectedPost] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.refetchQueries({ queryKey: ['community-posts'] });
      setNewComment('');
    }
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: number) => {
      if (likedPosts.has(postId)) {
        throw new Error('Already liked');
      }
      return apiRequest('POST', `/api/community/posts/${postId}/like`);
    },
    onSuccess: (_, postId) => {
      setLikedPosts(prev => new Set([...prev, postId]));
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.refetchQueries({ queryKey: ['community-posts'] });
    },
    onError: (error) => {
      if (error.message !== 'Already liked') {
        console.error('Error liking post:', error);
      }
    }
  });

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostCategory) {
      alert('Compila tutti i campi');
      return;
    }

    try {
      await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory
        })
      });

      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('');
      setIsCreateModalOpen(false);

      // Refresh posts
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Errore nella creazione del post');
    }
  };

  const handleEditPost = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editingPost) {
      alert('Compila tutti i campi');
      return;
    }

    try {
      await fetch(`/api/community/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          content: editContent
        })
      });

      setEditingPost(null);
      setEditTitle('');
      setEditContent('');

      // Refresh posts
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    } catch (error) {
      console.error('Error editing post:', error);
      alert('Errore nella modifica del post');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Sei sicuro di voler cancellare questo post?')) return;

    try {
      await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      // Refresh posts
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Errore nella cancellazione del post');
    }
  };

  const startEditing = (post: any) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleCreateComment = (postId: number) => {
    if (!newComment) return;
    createCommentMutation.mutate({ postId, content: newComment });
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'null null') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email ? email[0].toUpperCase() : email[0].toUpperCase();
  };

  const getDisplayName = (name: string, email: string) => {
    if (name && name !== 'null null') {
      return name;
    }
    return email ? email.split('@')[0] : email;
  };

  // Helper to format date, used in post header
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredPosts = selectedCategory === 'Tutte' 
    ? posts 
    : posts.filter((post: CommunityPost) => post.category === selectedCategory);

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Category Filter */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {['Tutte', 'Domande', 'Consigli', 'Investimenti', 'Finanza', 'Community'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`text-xs sm:text-sm ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Post Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-white">Fai una Domanda o Condividi</h3>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 touch-target"
              size="sm"
            >
              + Nuovo Post
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-3 sm:space-y-4">
        {filteredPosts.map((post: CommunityPost) => (
          <div key={post.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 hover:border-purple-500/50 transition-colors">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {getInitials(post.authorName, post.authorEmail)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{getDisplayName(post.authorName, post.authorEmail)}</span>
                        <Badge className={`text-white text-xs ${getUserRole(post.authorEmail) === 'Coach' ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                          {getUserRole(post.authorEmail) === 'Coach' && <Crown className="w-3 h-3 mr-1" />}
                          {getUserRole(post.authorEmail)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2">
                    {canEditPost(post) && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(post)}
                          className="text-gray-400 hover:text-white p-1 h-auto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-400 p-1 h-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isAdmin && !canEditPost(post) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-400 p-1 h-auto"
                        title="Admin: Cancella post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

            {/* Post Content */}
            {post.title && (
              <h4 className="font-semibold text-lg sm:text-xl text-white mb-2 sm:mb-3">{post.title}</h4>
            )}
            <p className="text-gray-300 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">{post.content}</p>

            {/* Post Actions */}
            <div className="flex items-center justify-between sm:justify-start sm:space-x-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => !likedPosts.has(post.id) && likePostMutation.mutate(post.id)}
                  disabled={likedPosts.has(post.id) || likePostMutation.isPending}
                  className={`flex items-center space-x-2 px-2 py-1 rounded-full transition-colors min-h-[44px] ${
                    likedPosts.has(post.id) 
                      ? 'text-blue-500 bg-blue-500/10' 
                      : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-blue-500' : ''}`} />
                  <span className="text-sm">{post.likes}</span>
                </button>

                <button
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  className="flex items-center space-x-2 px-2 py-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors min-h-[44px]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{post.commentsCount}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm px-3 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 min-h-[44px] whitespace-nowrap"
              >
                {post.category === 'Domande' ? 'Rispondi' : 'Commenta'}
              </button>
            </div>

            {/* Comments Section */}
            {selectedPost === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                {/* Comments List */}
                <div className="space-y-3 mb-4">
                  {comments.map((comment: Comment) => (
                    <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {getInitials(comment.authorName, comment.authorEmail)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {getDisplayName(comment.authorName, comment.authorEmail)}
                          </span>
                          <Badge className={`text-white text-xs ${getUserRole(comment.authorEmail) === 'Coach' ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                            {getUserRole(comment.authorEmail) === 'Coach' && <Crown className="w-3 h-3 mr-1" />}
                            {getUserRole(comment.authorEmail)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Comment Form */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {userData && getInitials(userData.firstName + ' ' + userData.lastName, userData.email)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={post.category === 'Domande' ? 'Scrivi la tua risposta...' : 'Scrivi un commento...'}
                      className="bg-gray-700 border-gray-600 text-white mb-2 min-h-[80px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleCreateComment(post.id)}
                        disabled={!newComment.trim() || createCommentMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        size="sm"
                      >
                        {createCommentMutation.isPending ? 'Invio...' : (post.category === 'Domande' ? 'Rispondi' : 'Commenta')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Benvenuto nella Community!
            </h3>
            <p className="text-gray-600 mb-4">
              Sii il primo a condividere qualcosa con la community di Percorso Capitale.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Crea il primo post
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Post Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Post</DialogTitle>
            <DialogDescription>
              Condividi una domanda, consiglio o esperienza con la community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="❓ Domande">❓ Domande</SelectItem>
                  <SelectItem value="💡 Consigli">💡 Consigli</SelectItem>
                  <SelectItem value="💰 Investimenti">💰 Investimenti</SelectItem>
                  <SelectItem value="💰 Finanza">💰 Finanza</SelectItem>
                  <SelectItem value="👥 Community">👥 Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Titolo</label>
              <Input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Scrivi il titolo del post..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contenuto</label>
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Scrivi il contenuto del post..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreatePost} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Pubblica
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Post</DialogTitle>
            <DialogDescription>
              Modifica il titolo e il contenuto del tuo post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titolo</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Scrivi il titolo del post..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contenuto</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Scrivi il contenuto del post..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Annulla
              </Button>
              <Button onClick={handleEditPost} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Salva Modifiche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}