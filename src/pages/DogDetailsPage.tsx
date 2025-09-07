import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dogService, personService, newsService } from '../services/supabaseService';
import type { Dog, DogImage, Person, NewsPost as NewsPostType } from '../services/supabaseService';
import Button from '../components/ui/Button';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import HorizontalTree, { type TreeNode } from '../components/HorizontalTree';
import { renderPedigreeNode, type PedigreeData } from '../components/Pedigree';
import { decodeDogId, createDogDetailPath } from '../utils/dogUtils';
import { useAuth } from '../contexts/AuthContext';
import { DogForm } from '../components/DogForm';
import { useTranslation } from '../contexts/LanguageContext';
import { ProfilePictureSkeleton } from '../components/skeletons';
import NewsPost from '../components/NewsPost';

import ClickableCloudinaryImage from '../components/ClickableCloudinaryImage';

function DogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('pages');
  const [dog, setDog] = useState<Dog | null>(null);
  const [profileImage, setProfileImage] = useState<DogImage | null>(null);
  const [owner, setOwner] = useState<Person | null>(null);
  const [breeder, setBreeder] = useState<Person | null>(null);
  const [newsPosts, setNewsPosts] = useState<NewsPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(t('dogs.messages.dogNotFound'));
      setLoading(false);
      return;
    }

    loadDog();
  }, [id]);

  const loadDog = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Decode the dog ID to handle encoded special characters like forward slashes
      const decodedDogId = decodeDogId(id);
      const dogData = await dogService.getDogById(decodedDogId);
      if (dogData) {
        // Sort ancestors by generation and path for consistent ordering
        if (dogData.all_ancestors) {
          dogData.all_ancestors.sort((a, b) => {
            // First sort by generation
            if (a.generation !== b.generation) {
              return a.generation - b.generation;
            }
            // Then sort by path (lexicographically)
            return (a.path || '').localeCompare(b.path || '');
          });
        }
        setDog(dogData);

        // Load profile image if available
        try {
          const imageData = await dogService.getDogProfileImage(decodedDogId);
          setProfileImage(imageData);
        } catch (error) {
          console.info('Profile image not available for this dog');
          setProfileImage(null);
        }

        // Load owner information if available
        if (dogData.owner_person_id) {
          try {
            const ownerData = await personService.getPersonById(dogData.owner_person_id);
            setOwner(ownerData);
          } catch (error) {
            console.info('Owner information not available for this dog');
            setOwner(null);
          }
        } else {
          setOwner(null);
        }

        // Load breeder information if available
        if (dogData.breeder_id) {
          try {
            const breederData = await personService.getPersonById(dogData.breeder_id);
            setBreeder(breederData);
          } catch (error) {
            console.info('Breeder information not available for this dog');
            setBreeder(null);
          }
        } else {
          setBreeder(null);
        }

        // Load news posts that feature this dog
        try {
          const newsData = await newsService.getNewsPostsByDogId(decodedDogId);
          setNewsPosts(newsData);
        } catch (error) {
          console.error('Error fetching news posts:', error);
          setNewsPosts([]);
        }
      } else {
        setError(t('dogs.messages.dogNotFound'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forms.messages.loadError', 'forms'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditSave = (updatedDog: Dog) => {
    setDog(updatedDog);
    setShowEditForm(false);
    // Optionally show a success message
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };



  const formatDate = (dateString?: string) => {
    if (!dateString) return t('dogs.labels.unknown');
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return t('dogs.labels.unknown');
    const birth = new Date(birthDate);
    const death = deathDate ? new Date(deathDate) : null;
    const now = new Date();

    if (death) {
      const age = death.getFullYear() - birth.getFullYear();
      return t('dogs.labels.yearsOld', { count: age });
    }

    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      return t('dogs.labels.yearsOld', { count: years - 1 });
    }
    return t('dogs.labels.yearsOld', { count: years });
  };

  // Helper function to convert dog data to pedigree data format
  const dogToPedigreeData = (dog: any, relation: string): PedigreeData => {
    // Try to get image data from the dog's profile image if available
    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    // Check if profile_image is an array (from ancestor data) or a single object
    let profileImage;
    if (Array.isArray(dog.profile_image)) {
      // Filter for profile images (is_profile = true) and take the first one
      profileImage = dog.profile_image.find((img: any) => img.is_profile) || dog.profile_image[0];
    } else {
      profileImage = dog.profile_image;
    }

    if (profileImage) {
      if (profileImage.image_public_id) {
        // Prefer Cloudinary public ID over manual URL construction
        imagePublicId = profileImage.image_public_id;
      } else if (profileImage.image_url) {
        imageUrl = profileImage.image_url;
      }
    } else {
      // Do nothing
    }

    return {
      relation,
      name: dog.name,
      titles: dog.titles?.map((t: any) => t.title_code) || [],
      regnr: dog.id,
      fallbackInitials: dog.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2),
      imageUrl,
      imagePublicId
    };
  };

  // Custom render function for pedigree nodes with navigation
  const renderClickablePedigreeNode = (data: PedigreeData, level: number) => {
    const handlePedigreeClick = () => {
      navigate(createDogDetailPath(data.regnr));
    };

    return (
      <div onClick={handlePedigreeClick} className="cursor-pointer">
        {renderPedigreeNode(data, level)}
      </div>
    );
  };

  // Build multi-generation pedigree tree for father's line
  const buildFatherTree = (): TreeNode<PedigreeData> | null => {
    if (!dog?.all_ancestors) return null;

    const generationLimit = 3;
    const filteredAncestors = dog.all_ancestors.filter(a => a.generation <= generationLimit);

    // Get the father (path "0")
    const father = filteredAncestors.find(a => a.path === '0');
    if (!father) return null;

    // Build the tree recursively using path-based navigation
    const buildTreeFromPath = (path: string): TreeNode<PedigreeData> | null => {
      const ancestor = filteredAncestors.find(a => a.path === path);
      if (!ancestor) return null;

      const children: TreeNode<PedigreeData>[] = [];

      // Add father (append "0" to current path)
      const fatherPath = path + '0';
      const fatherChild = buildTreeFromPath(fatherPath);
      if (fatherChild) {
        children.push(fatherChild);
      }

      // Add mother (append "1" to current path)
      const motherPath = path + '1';
      const motherChild = buildTreeFromPath(motherPath);
      if (motherChild) {
        children.push(motherChild);
      }

      return {
        data: dogToPedigreeData(ancestor.parent, getRelationLabel(ancestor.path || '')),
        children
      };
    };

    return buildTreeFromPath('0');
  };

  // Build multi-generation pedigree tree for mother's line  
  const buildMotherTree = (): TreeNode<PedigreeData> | null => {
    if (!dog?.all_ancestors) return null;

    const generationLimit = 3;
    const filteredAncestors = dog.all_ancestors.filter(a => a.generation <= generationLimit);

    // Get the mother (path "1")
    const mother = filteredAncestors.find(a => a.path === '1');
    if (!mother) return null;

    // Build the tree recursively using path-based navigation
    const buildTreeFromPath = (path: string): TreeNode<PedigreeData> | null => {
      const ancestor = filteredAncestors.find(a => a.path === path);
      if (!ancestor) return null;

      const children: TreeNode<PedigreeData>[] = [];

      // Add father (append "0" to current path)
      const fatherPath = path + '0';
      const fatherChild = buildTreeFromPath(fatherPath);
      if (fatherChild) {
        children.push(fatherChild);
      }

      // Add mother (append "1" to current path)
      const motherPath = path + '1';
      const motherChild = buildTreeFromPath(motherPath);
      if (motherChild) {
        children.push(motherChild);
      }

      return {
        data: dogToPedigreeData(ancestor.parent, getRelationLabel(ancestor.path || '')),
        children
      };
    };

    return buildTreeFromPath('1');
  };

  // Helper function to get appropriate relation label based on path
  const getRelationLabel = (path: string): string => {
    if (path === '0') return 'Father';
    if (path === '1') return 'Mother';
    if (path === '00') return 'Paternal Grandfather';
    if (path === '01') return 'Paternal Grandmother';
    if (path === '10') return 'Maternal Grandfather';
    if (path === '11') return 'Maternal Grandmother';
    if (path === '000') return 'Paternal Great-Grandfather (Father\'s Father\'s Father)';
    if (path === '001') return 'Paternal Great-Grandmother (Father\'s Father\'s Mother)';
    if (path === '010') return 'Paternal Great-Grandfather (Father\'s Mother\'s Father)';
    if (path === '011') return 'Paternal Great-Grandmother (Father\'s Mother\'s Mother)';
    if (path === '100') return 'Maternal Great-Grandfather (Mother\'s Father\'s Father)';
    if (path === '101') return 'Maternal Great-Grandmother (Mother\'s Father\'s Mother)';
    if (path === '110') return 'Maternal Great-Grandfather (Mother\'s Mother\'s Father)';
    if (path === '111') return 'Maternal Great-Grandmother (Mother\'s Mother\'s Mother)';

    // For deeper generations, provide a more generic label
    const generation = path.length;
    const lastDigit = path[path.length - 1];
    const gender = lastDigit === '0' ? 'Grandfather' : 'Grandmother';

    if (generation === 4) return `Great-Great-${gender}`;
    if (generation === 5) return `Great-Great-Great-${gender}`;

    return `${generation}th Generation ${gender}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        {/* Back Button Skeleton */}
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse mb-4" />

        {/* Header Section Skeleton */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="flex space-x-2">
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Profile Picture Skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center text-center">
            <ProfilePictureSkeleton size="2xl" className="mb-4" />
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Basic Info Skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full md:col-span-2">
            <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-1">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Titles Section Skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Pedigree Section Skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="w-56 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-8">
            <div className="w-full h-32 bg-gray-200 rounded animate-pulse" />
            <div className="w-full h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4" color="danger" className="mb-4">
            {error || t('dogs.messages.dogNotFound')}
          </Typography>
          <Button onClick={() => navigate('/dogs')}>
            {t('dogs.actions.backToDogs')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl justify-center mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dogs')}
            className="mb-4"
          >
            ← {t('dogs.actions.backToDogs')}
          </Button>
          <Typography variant="h2" className="mb-2">
            {dog.name}
          </Typography>
          {dog.nickname && (
            <Typography variant="h4" color="muted" className="italic">
              "{dog.nickname}"
            </Typography>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-3">
            {/* Edit Button - Only visible for authenticated users */}
            {user && (
              <Button
                variant="primary"
                onClick={handleEditClick}
                className="mb-2"
              >
                ✏️ {t('dogs.actions.editDog')}
              </Button>
            )}
            <div>
              {dog.is_deceased && (
                <Badge variant="danger" className="ml-2">
                  {t('dogs.labels.deceased')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Row: Photo and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Dog Image */}
        <div className="rounded-lg h-full flex flex-col">
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {profileImage ? (
              profileImage.image_public_id ? (
                <ClickableCloudinaryImage
                  publicId={profileImage.image_public_id}
                  width={400}
                  height={400}
                  alt={profileImage.alt_text || `${dog.name} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={profileImage.image_url}
                  alt={profileImage.alt_text || `${dog.name} profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <span class="text-4xl text-gray-400">${dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                      </div>
                    `;
                  }}
                />
              )
            ) : (
              <Typography variant="h1" color="muted" className="select-none shadow-sm  border border-gray-200 bg-white rounded-lg p-2 w-full h-full text-center place-content-center">
                {dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Typography>
            )}
          </div>
          <Typography variant="caption" color="muted" className="text-center block">
            {profileImage ? `Updated: ${new Date(profileImage.created_at).toLocaleDateString()}` : t('dogs.messages.photoComingSoon')}
          </Typography>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full md:col-span-2">
          <Typography variant="h4" className="mb-4">{t('dogs.sections.basicInfo')}</Typography>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.breed')}</Typography>
              <Typography variant="body">{dog.breed?.name || t('dogs.labels.unknown')}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.registrationId')}</Typography>
              <Typography variant="body" className="font-mono">{dog.id}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.name')}</Typography>
              <Typography variant="body">{dog.name}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.nickname')}</Typography>
              <Typography variant="body">{dog.nickname || t('dogs.labels.unknown')}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.birthDate')}</Typography>
              <Typography variant="body">{formatDate(dog.birth_date)}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.age')}</Typography>
              <Typography variant="body">{calculateAge(dog.birth_date, dog.death_date)}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">{t('dogs.labels.gender')}</Typography>
              <Typography variant="body">{dog.gender === 'M' ? t('dogs.labels.male') : t('dogs.labels.female')}</Typography>
            </div>
            {dog.color && (
              <div>
                <Typography variant="caption" color="muted">{t('dogs.labels.color')}</Typography>
                <Typography variant="body">{dog.color}</Typography>
              </div>
            )}
            {dog.death_date && (
              <div>
                <Typography variant="caption" color="muted">{t('dogs.labels.deathDate')}</Typography>
                <Typography variant="body">{formatDate(dog.death_date)}</Typography>
              </div>
            )}
            {dog.owner_person_id && (
              <div>
                <Typography variant="caption" color="muted">{t('dogs.labels.owner')}</Typography>
                <Typography variant="body">
                  {owner ? owner.name : dog.owner_person_id}
                </Typography>
              </div>
            )}
            {dog.breeder_id && (
              <div>
                <Typography variant="caption" color="muted">{t('dogs.labels.breeder')}</Typography>
                <Typography variant="body">
                  {breeder ? breeder.name : dog.breeder_id}
                </Typography>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Titles Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h4">{t('dogs.sections.titlesAchievements')}</Typography>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dogs/${encodeURIComponent(dog.id)}/titles`)}
              className="text-gray-500 hover:text-gray-700 border-gray-300"
            >
              ✏️ {t('dogs.actions.editTitles')}
            </Button>
          )}
        </div>
        {dog.titles && dog.titles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dog.titles.map((title, index) => (
              <Badge key={index} variant="secondary">
                {title.title_code}
                {title.year_earned && ` (${title.year_earned})`}
              </Badge>
            ))}
          </div>
        ) : (
          <Typography variant="body" color="secondary">
            {t('dogs.messages.noTitles')}
            {user && (
              <> {t('dogs.messages.clickEditTitles')}</>
            )}
          </Typography>
        )}
      </div>

      {/* Full Width Content */}
      <div className="space-y-6">

        {/* Pedigree */}
        {(() => {
          const fatherTree = buildFatherTree();
          const motherTree = buildMotherTree();
          const hasPedigree = fatherTree || motherTree;

          if (!hasPedigree) return <>{user && (<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <Typography variant="h4">{t('dogs.sections.pedigree')}</Typography>
              {user && (
                <div className="flex gap-2">

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/dogs/${encodeURIComponent(dog.id)}/pedigree/father`)}
                  >
                    ✏️ {t('dogs.actions.editFatherLine')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/dogs/${encodeURIComponent(dog.id)}/pedigree/mother`)}
                  >
                    ✏️ {t('dogs.actions.editMotherLine')}
                  </Button>

                </div>
              )}
            </div>
          </div>)}</>;

          return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h4">{t('dogs.sections.pedigree')}</Typography>
                {user && (
                  <div className="flex gap-2">
                    {fatherTree && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/dogs/${encodeURIComponent(dog.id)}/pedigree/father`)}
                      >
                        ✏️ {t('dogs.actions.editFatherLine')}
                      </Button>
                    )}
                    {motherTree && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/dogs/${encodeURIComponent(dog.id)}/pedigree/mother`)}
                      >
                        ✏️ {t('dogs.actions.editMotherLine')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-8 lg:flex gap-4 ">
                {fatherTree && (
                  <div>
                    <Typography variant="h5" className="mb-4">Father's Line</Typography>
                    <div className="overflow-x-auto">
                      <HorizontalTree
                        tree={fatherTree}
                        renderNode={renderClickablePedigreeNode}
                        maxDepth={3}
                        lineStyle={{ color: "#e5e7eb", thickness: 2, style: "solid" }}
                      />
                    </div>
                  </div>
                )}

                {motherTree && (
                  <div>
                    <Typography variant="h5" className="mb-4">Mother's Line</Typography>
                    <div className="overflow-x-auto">
                      <HorizontalTree
                        tree={motherTree}
                        renderNode={renderClickablePedigreeNode}
                        maxDepth={3}
                        lineStyle={{ color: "#e5e7eb", thickness: 2, style: "solid" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* News Posts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <Typography variant="h4">{t('dogs.sections.newsPosts')}</Typography>
        </div>
        
        {newsPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newsPosts.map((post) => (
              <NewsPost
                key={post.id}
                imageUrl={post.image_url || ''}
                imageAlt={post.image_alt || post.title}
                imagePublicId={post.image_public_id}
                fallbackImageUrl={post.fallback_image_url}
                date={post.published_date}
                title={post.title}
                content={post.content.replace(/<[^>]*>/g, '')}
                taggedDogs={post.tagged_dogs?.map(dog => dog.id) || []}
                size="sm"
                dateFormat="short"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Typography variant="body" color="secondary">
              {t('dogs.messages.noNewsPosts')}
            </Typography>
          </div>
        )}
      </div>

      {/* Edit Form Modal - Only shown when editing */}
      {showEditForm && user && dog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between">
                <Typography variant="h3">
                  Edit {dog.name}
                </Typography>
                <Button
                  variant="ghost"
                  onClick={handleEditCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <DogForm
                dogId={dog.id}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default DogDetailsPage;
