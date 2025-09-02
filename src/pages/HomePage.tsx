import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import NewsPost from '../components/NewsPost';
import DogCard from '../components/DogCard';
import { newsService, dogService, contentService } from '../services/supabaseService';
import type { NewsPost as NewsPostType, MyDog, DogImage, ContentSection } from '../services/supabaseService';
import { createDogDetailPath } from '../utils/dogUtils';
import HighlightedNewsPost from '../components/HighlightedNewsPost';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestNews, setLatestNews] = useState<NewsPostType[]>([]);
  const [featuredDogs, setFeaturedDogs] = useState<MyDog[]>([]);
  const [dogImages, setDogImages] = useState<Record<string, DogImage | null>>({});
  const [aboutContent, setAboutContent] = useState<ContentSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomePageData();
  }, []);

  const loadHomePageData = async () => {
    try {

      // Load latest news (first 3 posts)
      const news = await newsService.getPublishedNewsPosts();
      setLatestNews(news.slice(0, 4));

      // Load about content
      const about = await contentService.getContentByKey('about_kennel');
      setAboutContent(about);

      // Load featured dogs (first 4 dogs)
      const myDogs = await dogService.getMyDogs();
      const featured = myDogs.slice(0, 4);
      setFeaturedDogs(featured);

      // Load profile images for featured dogs
      const imagePromises = featured.map(async (myDog) => {
        if (myDog.dog) {
          try {
            const image = await dogService.getDogProfileImage(myDog.dog.id);
            return { dogId: myDog.dog.id, image };
          } catch (error) {
            return { dogId: myDog.dog.id, image: null };
          }
        }
        return null;
      });

      const imageResults = await Promise.all(imagePromises);
      const imagesMap: Record<string, DogImage | null> = {};
      imageResults.forEach(result => {
        if (result) {
          imagesMap[result.dogId] = result.image;
        }
      });

      setDogImages(imagesMap);
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDogClick = (dogId: string) => {
    navigate(createDogDetailPath(dogId));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="text-center mb-8">
          <Typography variant="h1" weight="bold" className="text-4xl md:text-6xl text-gray-900 mb-4">
            Kennel Speedex
          </Typography>
          <Typography variant="h3" className="text-gray-600 max-w-3xl mx-auto text-xl md:text-2xl">
            Opdræt under DKK og FCI
          </Typography>
        </div>

        {/* Latest News Section */}
        <div className="mb-20">
          <div className="mb-12">
            <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900">
              Seneste Nyheder
            </Typography>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Typography variant="body" color="secondary">Indlæser nyheder...</Typography>
            </div>
          ) : latestNews.length > 0 ? (
            <div className="space-y-12">
              {/* Highlighted News Post (First/Latest) */}
              <HighlightedNewsPost
                id={latestNews[0].id}
                title={latestNews[0].title}
                content={latestNews[0].content}
                date={latestNews[0].published_date}
                imageUrl={latestNews[0].image_url || ''}
                imagePublicId={latestNews[0].image_public_id}
                imageAlt={latestNews[0].image_alt || ''}
                taggedDogs={latestNews[0].tagged_dogs?.map(dog => dog.id) || []}
              />

              {/* Additional News Cards (if more than 1 post) */}
              {latestNews.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {latestNews.slice(1).map((post) => (
                    <NewsPost
                      imageUrl={post.image_url || ''}
                      imageAlt={post.image_alt || ''}
                      date={post.published_date}
                      title={post.title}
                      content={post.content}
                      taggedDogs={post.tagged_dogs?.map(dog => dog.id) || []}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Typography variant="body" color="secondary">Ingen nyheder endnu. Kom tilbage senere!</Typography>
            </div>
          )}

          <div className="text-center mt-8">
            <Button
              variant="primary"
              onClick={() => navigate('/news')}
            >
              Se Alle Nyheder
            </Button>
          </div>
        </div>

        {/* About Section */}
        {aboutContent && (
          <div className="mb-20">
            <div>
              <div className="flex items-center justify-between mb-8">
                <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900">
                  {aboutContent.title}
                </Typography>
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/content/edit/${aboutContent.section_key}`)}
                    className="text-gray-500 hover:text-gray-700 border-gray-300"
                  >
                    ✏️ Edit
                  </Button>
                )}
              </div>

              <div className="prose prose-lg max-w-none">
                {aboutContent.content.split('\n\n').map((paragraph, index) => (
                  <Typography key={index} variant="body" className="text-lg text-gray-600 leading-relaxed mb-6">
                    {paragraph}
                  </Typography>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                      {new Date().getFullYear() - 2005} års erfaring
                    </Typography>
                    <Typography variant="body" color="secondary">
                      Siden 2005
                    </Typography>
                  </div>

                  <div className="text-center">
                    <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                      DKK Certificeret
                    </Typography>
                    <Typography variant="body" color="secondary">
                      Dansk Kennel Klub
                    </Typography>
                  </div>

                  <div className="text-center">
                    <Typography variant="h4" weight="semibold" className="text-gray-900 mb-2">
                      Norfolk Terriers
                    </Typography>
                    <Typography variant="body" color="secondary">
                      Primært fokus
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured Dogs Section */}
        <div className="mb-20">
          <div className="mb-12">
            <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900 mb-6">
              Mød Vores Hunde
            </Typography>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Typography variant="body" color="secondary">Indlæser hunde...</Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredDogs.map((myDog) => {
                if (!myDog.dog) return null;

                return (
                  <DogCard
                    key={myDog.dog.id}
                    name={myDog.dog.name}
                    breed={myDog.dog.breed?.name || 'Unknown Breed'}
                    imagePublicId={dogImages[myDog.dog.id]?.image_public_id}
                    imageUrl={dogImages[myDog.dog.id]?.image_url}
                    imageSize={266}
                    imageAlt={dogImages[myDog.dog.id]?.alt_text || `${myDog.dog.name} - ${myDog.dog.breed?.name}`}
                    imageGravity='face'
                    fallbackInitials={myDog.dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    subtitle={myDog.dog.nickname ? `"${myDog.dog.nickname}"` : undefined}
                    metadata={[
                      myDog.dog.gender === 'M' ? 'Han' : 'Hun',
                      myDog.dog.birth_date ? new Date(myDog.dog.birth_date).getFullYear().toString() : undefined,
                    ].filter((item): item is string => Boolean(item))}
                    dogId={myDog.dog.id}
                    onDogClick={() => handleDogClick(myDog.dog!.id)}
                  />
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Button
              variant="primary"
              onClick={() => navigate('/dogs')}
            >
              Se Alle Vores Hunde
            </Button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-200 pt-16">
          <div className="text-center max-w-2xl mx-auto">
            <Typography variant="h2" weight="bold" className="text-3xl md:text-4xl text-gray-900 mb-6">
              Kontakt
            </Typography>
            <Typography variant="body" className="text-lg text-gray-600">
              For spørgsmål om vores opdræt eller information om kommende kuld.
            </Typography>

            <div className="inline-block">
              <Button
                variant="ghost"
                onClick={() => window.location.href = 'mailto:tinearnild@hotmail.com'}
                className="text-gray-900 border-gray-300 hover:bg-gray-50 px-6 py-3"
              >
                tinearnild@hotmail.com
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;