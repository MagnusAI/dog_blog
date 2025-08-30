import { useState, useEffect } from 'react';
import NewsPost from '../components/NewsPost';
import HighlightedNewsPost from '../components/HighlightedNewsPost';
import { newsService, type NewsPost as NewsPostType } from '../services/supabaseService';

function NewsPage() {
  const [newsPosts, setNewsPosts] = useState<NewsPostType[]>([]);
  const [featuredPost, setFeaturedPost] = useState<NewsPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadNewsPosts();
  }, []);

  // Helper function to get tagged dog IDs for components
  const getTaggedDogIds = (post: NewsPostType): string[] => {
    return post.tagged_dogs?.map(dog => dog.id) || [];
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">News Archive</h1>
        <p className="text-gray-600">
          Stay updated with the latest news, achievements, and insights from our kennel.
        </p>
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
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Featured Post */}
          {featuredPost && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured</h2>
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
            </div>
          )}

          {/* All News Posts Grid */}
          {newsPosts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {featuredPost ? 'More News' : 'All News'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsPosts.map((post, index) => (
                  <NewsPost
                    key={post.id}
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
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!featuredPost && newsPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No News Posts Yet</h3>
              <p className="text-gray-600 mb-4">
                Check back later for the latest news and updates from our kennel.
              </p>
            </div>
          )}

          {/* Posts count */}
          {(featuredPost || newsPosts.length > 0) && (
            <div className="flex justify-center pt-8">
              <div className="text-gray-500 text-sm">
                Showing {(featuredPost ? 1 : 0) + newsPosts.length} news post{(featuredPost ? 1 : 0) + newsPosts.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NewsPage;
