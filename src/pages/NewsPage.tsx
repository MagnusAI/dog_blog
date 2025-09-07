import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsPost from '../components/NewsPost';
import HighlightedNewsPost from '../components/HighlightedNewsPost';
import Button from '../components/ui/Button';
import { newsService, type NewsPost as NewsPostType } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

function NewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newsPosts, setNewsPosts] = useState<NewsPostType[]>([]);
  const [featuredPost, setFeaturedPost] = useState<NewsPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const { t } = useTranslation('pages');

  const loadNewsPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all published news posts
      const posts = await newsService.getPublishedNewsPosts();
      
      if (posts.length > 0) {
        // Use the most recent post as featured
        setFeaturedPost(posts[0]);
        // The rest are regular posts
        setNewsPosts(posts.slice(1));
      } else {
        setFeaturedPost(null);
        setNewsPosts([]);
      }
    } catch (err) {
      console.error('Error loading news posts:', err);
      setError('Failed to load news posts. Please try again later.');
      setFeaturedPost(null);
      setNewsPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewsPosts();
  }, []);

  // Helper function to get tagged dog IDs for components
  const getTaggedDogIds = (post: NewsPostType): string[] => {
    return post.tagged_dogs?.map(dog => dog.id) || [];
  };

  const handlePostCardClick = (post: NewsPostType) => {
    if (editMode) {
      // In edit mode, toggle selection
      togglePostSelection(post.id);
    } else {
      // Not in edit mode - posts open in modal automatically
      // No additional action needed as NewsPost handles modal opening
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Entering edit mode - clear selection
      setSelectedPosts(new Set());
    } else {
      // Exiting edit mode - clear selection
      setSelectedPosts(new Set());
    }
    setEditMode(!editMode);
  };

  const handleEditSelectedPost = () => {
    if (selectedPosts.size !== 1) return;
    
    const postId = Array.from(selectedPosts)[0];
    navigate(`/news/edit/${postId}`);
  };

  const handleDeleteSelectedPosts = async () => {
    if (selectedPosts.size === 0) return;
    
    const confirmMessage = selectedPosts.size === 1 
      ? t('news.messages.confirmDelete') 
      : t('news.messages.confirmDeleteMultiple', {count: selectedPosts.size});
    
    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      
      // Delete all selected posts
      const deletePromises = Array.from(selectedPosts).map(postId => 
        newsService.deleteNewsPost(postId)
      );
      
      await Promise.all(deletePromises);
      
      // Reload posts and exit edit mode
      await loadNewsPosts();
      setEditMode(false);
      setSelectedPosts(new Set());
    } catch (err) {
      console.error('Error deleting news posts:', err);
      setError('Failed to delete news posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewPost = () => {
    navigate('/news/new');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl justify-center mx-auto">
      <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('news.sections.archive')}</h1>
        <p className="text-gray-600">
          {t('news.sections.archiveDescription')}
        </p>
      </div>
        <div className="flex gap-3">
          {user && (
            <>
              <Button
                variant={editMode ? "secondary" : "ghost"}
                onClick={toggleEditMode}
              >
                {editMode ? "Cancel Edit" : "Edit"}
              </Button>
              {editMode && selectedPosts.size === 1 && (
                <Button
                  variant="primary"
                  onClick={handleEditSelectedPost}
                >
                  Edit Post
                </Button>
              )}
              {editMode && selectedPosts.size > 0 && (
                <Button
                  variant="danger"
                  onClick={handleDeleteSelectedPosts}
                >
                  Delete ({selectedPosts.size})
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleAddNewPost}
                disabled={editMode}
              >
                {t('news.actions.addNews')}
              </Button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading news posts...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-red-800 hover:text-red-900 underline"
          >
            {t('news.messages.tryAgain')}
          </button>
        </div>
      )}

            {!loading && !error && (
        <>
      {/* Featured Post */}
          {featuredPost && (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('news.sections.featured')}</h2>
              <div 
                className={`relative ${editMode ? 'cursor-pointer' : ''} ${
                  editMode && selectedPosts.has(featuredPost.id) 
                    ? 'ring-2 ring-blue-500 rounded-lg' 
                    : ''
                }`}
                onClick={() => editMode && handlePostCardClick(featuredPost)}
              >
        <HighlightedNewsPost
                  imageUrl={featuredPost.image_url || ''}
                  imageAlt={featuredPost.image_alt || featuredPost.title}
                  date={featuredPost.published_date}
          title={featuredPost.title}
                  content={featuredPost.content}
          dateFormat="long"
          backgroundColor="transparent"
                  taggedDogs={getTaggedDogIds(featuredPost)}
                  imagePublicId={featuredPost.image_public_id}
                  fallbackImageUrl={featuredPost.fallback_image_url}
                />
                {editMode && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPosts.has(featuredPost.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedPosts.has(featuredPost.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
              </div>
      </div>
          )}

      {/* All News Posts Grid */}
          {newsPosts.length > 0 && (
      <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {featuredPost ? t('news.sections.moreNews') : t('news.sections.allNews')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newsPosts.map((post, index) => (
                  <div 
                    key={post.id}
                    className={`relative ${editMode ? 'cursor-pointer' : ''} ${
                      editMode && selectedPosts.has(post.id) 
                        ? 'ring-2 ring-blue-500 rounded-lg' 
                        : ''
                    }`}
                    onClick={() => editMode && handlePostCardClick(post)}
                  >
            <NewsPost
                      imageUrl={post.image_url || ''}
                      imageAlt={post.image_alt || post.title}
                      date={post.published_date}
              title={post.title}
                      content={post.content}
              size={index % 3 === 0 ? "lg" : index % 2 === 0 ? "md" : "sm"}
              dateFormat="short"
                      taggedDogs={getTaggedDogIds(post)}
                      imagePublicId={post.image_public_id}
                      fallbackImageUrl={post.fallback_image_url}
                    />
                    {editMode && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPosts.has(post.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedPosts.has(post.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
          ))}
        </div>
      </div>
          )}

          {/* Empty state */}
          {!featuredPost && newsPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('news.messages.noNewsPostsYet')}</h3>
              <p className="text-gray-600 mb-4">
                {t('news.messages.checkBackLater')}
              </p>
            </div>
          )}

          {/* Posts count */}
          {(featuredPost || newsPosts.length > 0) && (
      <div className="flex justify-center pt-8">
        <div className="text-gray-500 text-sm">
          {(() => {
            const count = (featuredPost ? 1 : 0) + newsPosts.length;
            return t(count === 1 ? 'news.messages.showing' : 'news.messages.showingPlural', { count });
          })()}
        </div>
      </div>
          )}

          {/* Archive Notice */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('news.sections.lookingForMore')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('news.messages.archiveNotice')}
              </p>
              <Button
                variant="secondary"
                onClick={() => window.open('https://www.speedex.dk', '_blank')}
                className="inline-flex items-center gap-2"
              >
                <span>🌐</span>
                {t('news.actions.visitOldSite')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NewsPage;
