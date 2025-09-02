import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NewsPostForm from '../components/NewsPostForm';
import Button from '../components/ui/Button';
import { newsService, type NewsPost as NewsPostType } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

function NewsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [editingPost, setEditingPost] = useState<NewsPostType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      loadPostForEdit(id);
    }
  }, [id, isEditMode]);

  const loadPostForEdit = async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      const post = await newsService.getNewsPostById(postId);
      
      if (!post) {
        setError('News post not found');
        return;
      }

      // Check if user owns this post (basic client-side check, server enforces this)
      if (post.author_id !== user?.id) {
        setError('You can only edit your own posts');
        return;
      }

      setEditingPost(post);
    } catch (err) {
      console.error('Error loading post for edit:', err);
      setError('Failed to load news post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsPostSubmit = async (data: any) => {
    try {
      if (isEditMode && editingPost) {
        // Update existing post
        await newsService.updateNewsPost({
          id: editingPost.id,
          title: data.title,
          content: data.content,
          image_url: data.imageUrl,
          image_alt: data.imageAlt,
          image_public_id: data.imagePublicId,
          tagged_dog_ids: data.taggedDogs
        });
      } else {
        // Create new post
        await newsService.createNewsPost({
          title: data.title,
          content: data.content,
          image_url: data.imageUrl,
          image_alt: data.imageAlt,
          image_public_id: data.imagePublicId,
          tagged_dog_ids: data.taggedDogs
        });
      }
      
      // Navigate back to news page
      navigate('/news');
    } catch (err) {
      console.error('Error saving news post:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleCancel = () => {
    navigate('/news');
  };

  // Helper function to get tagged dog IDs for form
  const getTaggedDogIds = (post: NewsPostType): string[] => {
    return post.tagged_dogs?.map(dog => dog.id) || [];
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/news')}>
              Back to News
            </Button>
            {isEditMode && (
              <Button 
                variant="secondary" 
                onClick={() => loadPostForEdit(id!)}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit News Post' : 'Create New News Post'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? 'Update your news post details and settings below.'
              : 'Share the latest news, achievements, and insights from your kennel.'
            }
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleCancel}
        >
          ← Back to News
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border">
        <NewsPostForm
          onSubmit={handleNewsPostSubmit}
          onCancel={handleCancel}
          initialData={editingPost ? {
            title: editingPost.title,
            content: editingPost.content,
            imageAlt: editingPost.image_alt || '',
            taggedDogs: getTaggedDogIds(editingPost)
          } : undefined}
        />
      </div>
    </div>
  );
}

export default NewsFormPage;
