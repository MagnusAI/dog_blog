import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DogCard from '../components/DogCard';
import Button from '../components/ui/Button';
import { dogService } from '../services/supabaseService';
import type { MyDog, DogImage } from '../services/supabaseService';
import { createDogDetailPath } from '../utils/dogUtils';
import { useAuth } from '../contexts/AuthContext';
import { dog } from '@cloudinary/url-gen/qualifiers/focusOn';
import { useTranslation } from '../contexts/LanguageContext';

function DogsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myDogs, setMyDogs] = useState<MyDog[]>([]);
  const [dogImages, setDogImages] = useState<Record<string, DogImage | null>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState<Set<number>>(new Set());

  const { t } = useTranslation('pages');

  useEffect(() => {
    loadMyDogs();
  }, []);

  const loadMyDogs = async () => {
    try {
      setLoading(true);
      const dogs = await dogService.getMyDogs();
      setMyDogs(dogs);
      
      // Load profile images for all dogs
      const imagePromises = dogs.map(async (myDog) => {
        if (myDog.dog) {
          try {
            const image = await dogService.getDogProfileImage(myDog.dog.id);
            return { dogId: myDog.dog.id, image };
          } catch (error) {
            console.info(`Profile image not available for ${myDog.dog.id}`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dogs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewDog = () => {
    navigate('/dogs/new');
  };

  const handleCardClick = (myDogId: number, dogId: string) => {
    if (editMode) {
      // In edit mode, toggle selection
      toggleDogSelection(myDogId);
    } else {
      // Not in edit mode, navigate to details
      navigate(createDogDetailPath(dogId));
    }
  };

  const toggleDogSelection = (myDogId: number) => {
    const newSelected = new Set(selectedDogs);
    if (newSelected.has(myDogId)) {
      newSelected.delete(myDogId);
    } else {
      newSelected.add(myDogId);
    }
    setSelectedDogs(newSelected);
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Entering edit mode - select all active dogs
      const activeDogIds = myDogs
        .filter(myDog => myDog.is_active)
        .map(myDog => myDog.id);
      setSelectedDogs(new Set(activeDogIds));
    } else {
      // Exiting edit mode - clear selection
      setSelectedDogs(new Set());
    }
    setEditMode(!editMode);
  };

  const saveDogStatusChanges = async () => {
    if (selectedDogs.size === 0) return;

    try {
      const updatePromises = myDogs.map(async (myDog) => {
        if (myDog.dog) {
          const shouldBeActive = selectedDogs.has(myDog.id);
          const currentIsActive = myDog.is_active;
          
          // Only update if status needs to change
          if (shouldBeActive !== currentIsActive) {
            await dogService.updateMyDog(myDog.id, { is_active: shouldBeActive });
          }
        }
      });

      await Promise.all(updatePromises);
      await loadMyDogs(); // Refresh the list
      setSelectedDogs(new Set()); // Clear selection
      setEditMode(false); // Exit edit mode
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dog status');
    }
  };


  const getDogsByBreed = () => {
    const dogsToGroup = user && editMode ? myDogs : myDogs.filter(myDog => myDog.is_active);
    
    // Group dogs by breed first
    const dogsByBreed: Record<string, typeof dogsToGroup> = {};
    
    dogsToGroup.forEach(myDog => {
      if (myDog.dog?.breed?.name) {
        const breedName = myDog.dog.breed.name;
        if (!dogsByBreed[breedName]) {
          dogsByBreed[breedName] = [];
        }
        dogsByBreed[breedName].push(myDog);
      }
    });

    // Sort each breed by creation date (newest first - descending order)
    Object.keys(dogsByBreed).forEach(breedName => {
      dogsByBreed[breedName].sort((a, b) => {
        const dateA = new Date(a.dog?.created_at || 0).getTime();
        const dateB = new Date(b.dog?.created_at || 0).getTime();
        return dateB - dateA; // Newest first (descending)
      });
    });
    
    // Define breed order with more flexible matching
    const breedOrder = [
      'Norfolk Terrier',
      'Jack Russell Terrier', 
      'Russell Terrier',
      'West Highland White Terrier',
      'Westie'
    ];
    
    // Create a mapping function to handle breed name variations
    const mapBreedName = (actualBreedName: string) => {
      const lowerActual = actualBreedName.toLowerCase();
      if (lowerActual.includes('norfolk')) return 'Norfolk Terrier';
      if (lowerActual.includes('jack russell') || lowerActual.includes('jrt')) return 'Jack Russell Terrier';
      if (lowerActual.includes('russell') && !lowerActual.includes('jack')) return 'Russell Terrier';
      if (lowerActual.includes('west highland') || lowerActual.includes('westie')) return 'West Highland White Terrier';
      return actualBreedName; // Return as-is if no match
    };
    
    // Group by mapped breed names
    const mappedDogsByBreed: Record<string, typeof dogsToGroup> = {};
    Object.keys(dogsByBreed).forEach(actualBreedName => {
      const mappedBreedName = mapBreedName(actualBreedName);
      if (!mappedDogsByBreed[mappedBreedName]) {
        mappedDogsByBreed[mappedBreedName] = [];
      }
      mappedDogsByBreed[mappedBreedName].push(...dogsByBreed[actualBreedName]);
    });
    
    // Return breeds in the specified order, only including breeds with dogs
    return breedOrder
      .filter(breedName => mappedDogsByBreed[breedName] && mappedDogsByBreed[breedName].length > 0)
      .map(breedName => ({
        breedName,
        dogs: mappedDogsByBreed[breedName]
      }));
  };

  const dogsByBreed = getDogsByBreed();
  const totalVisibleDogs = dogsByBreed.reduce((total, breed) => total + breed.dogs.length, 0);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-lg">{t('dogs.messages.loadingDogs')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          <div className="text-lg">Error: {error}</div>
          <Button onClick={loadMyDogs} className="mt-4">
            {t('dogs.messages.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl justify-center mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('dogs.sections.myDogs')}</h1>
        <div className="flex gap-3">
          {user && (
            <>
              <Button
                variant={editMode ? "secondary" : "ghost"}
                onClick={toggleEditMode}
              >
                {editMode ? t('dogs.messages.cancelEdit') : t('dogs.messages.edit')}
              </Button>
              {editMode && selectedDogs.size > 0 && (
                <Button
                  variant="primary"
                  onClick={saveDogStatusChanges}
                >
                  {t('dogs.messages.saveChanges', {count: selectedDogs.size})}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleAddNewDog}
              >
                {t('dogs.messages.addNewDog')}
              </Button>
            </>
          )}
        </div>
      </div>

      {totalVisibleDogs === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {user ? t('dogs.messages.noDogs') : t('dogs.messages.noActiveDogs')}
          </div>
          {user && (
            <Button
              variant="primary"
              onClick={handleAddNewDog}
            >
              {t('dogs.messages.addYourFirstDog')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-sm text-gray-600 mb-4">
            {totalVisibleDogs !== 1 ? t('dogs.messages.dogsInYourKennel', {count: totalVisibleDogs}) : t('dogs.messages.dogInYourKennel', {count: totalVisibleDogs})}
            {!user && t('dogs.messages.activeDogsOnly')}
            {editMode && user && (
              <span className="block mt-1 text-blue-600">
                {t('dogs.messages.activeDogsPreSelected')}
                <span className="block mt-1 text-sm">
                  Showing all dogs (active and inactive) for editing
                </span>
                {selectedDogs.size > 0 && (
                  <span className="block mt-1">
                    {t('dogs.messages.selectedCount', {count: selectedDogs.size})}
                  </span>
                )}
              </span>
            )}
          </div>
          
          {dogsByBreed.map(({ breedName, dogs }) => (
            <div key={breedName} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {breedName}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({dogs.length} {dogs.length === 1 ? 'dog' : 'dogs'})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {dogs.map((myDog: any) => {
                  if (!myDog.dog) return null;
                  
                  const isSelected = selectedDogs.has(myDog.id);
                  const isInactive = !myDog.is_active;
                  const isDeceased = myDog.dog.is_deceased;
                  
                  return (
                    <DogCard
                      key={myDog.dog.id}
                      name={myDog.dog.name}
                      breed={myDog.dog.breed?.name || 'Unknown Breed'}
                      imagePublicId={dogImages[myDog.dog.id]?.image_public_id}
                      imageUrl={dogImages[myDog.dog.id]?.image_url}
                      imageSize={266}
                      imageAlt={dogImages[myDog.dog.id]?.alt_text || `${myDog.dog.name} - ${myDog.dog.breed?.name}`}
                      imageGravity={dog()}
                      fallbackInitials={myDog.dog.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      subtitle={myDog.dog.nickname ? `"${myDog.dog.nickname}"` : undefined}
                      metadata={[
                        myDog.dog.gender === 'M' ? 'Male' : 'Female',
                        myDog.dog.birth_date ? new Date(myDog.dog.birth_date).getFullYear().toString() : undefined,
                        myDog.acquisition_date ? `Acquired: ${new Date(myDog.acquisition_date).toLocaleDateString()}` : undefined,
                        isInactive ? 'Inactive' : undefined,
                        isDeceased ? 'Deceased' : undefined
                      ].filter((item): item is string => Boolean(item))}
                      dogId={myDog.dog.id}
                      onDogClick={() => handleCardClick(myDog.id, myDog.dog!.id)}
                      className={`
                        ${editMode ? 'cursor-pointer' : ''}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : ''}
                        ${isInactive ? 'opacity-60 bg-gray-50' : ''}
                        ${isDeceased ? 'bg-red-50 border-red-200' : ''}
                        ${isInactive && isDeceased ? 'bg-red-100' : ''}
                        ${editMode && !isSelected ? 'hover:ring-1 hover:ring-gray-300' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DogsPage;
