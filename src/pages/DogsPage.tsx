import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DogCard from '../components/DogCard';
import Button from '../components/ui/Button';
import { dogService } from '../services/supabaseService';
import type { MyDog, DogImage } from '../services/supabaseService';
import { createDogDetailPath } from '../utils/dogUtils';
import { useAuth } from '../contexts/AuthContext';
import { dog } from '@cloudinary/url-gen/qualifiers/focusOn';

function DogsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myDogs, setMyDogs] = useState<MyDog[]>([]);
  const [dogImages, setDogImages] = useState<Record<string, DogImage | null>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState<Set<number>>(new Set());

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

  const getVisibleDogs = () => {
    if (user && editMode) {
      // Authenticated users see all dogs (active and inactive)
      return myDogs;
    } else {
      // Non-authenticated users only see active dogs
      return myDogs.filter(myDog => myDog.is_active);
    }
  };

  const visibleDogs = getVisibleDogs();

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-lg">Loading your dogs...</div>
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
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl justify-center mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Dogs</h1>
        <div className="flex gap-3">
          {user && (
            <>
              <Button
                variant={editMode ? "secondary" : "ghost"}
                onClick={toggleEditMode}
              >
                {editMode ? "Cancel Edit" : "Edit"}
              </Button>
              {editMode && selectedDogs.size > 0 && (
                <Button
                  variant="primary"
                  onClick={saveDogStatusChanges}
                >
                  Save Changes ({selectedDogs.size} selected)
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleAddNewDog}
              >
                Add New Dog
              </Button>
            </>
          )}
        </div>
      </div>

      {visibleDogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {user ? "You haven't added any dogs yet." : "No active dogs available."}
          </div>
          {user && (
            <Button
              variant="primary"
              onClick={handleAddNewDog}
            >
              Add Your First Dog
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-4">
            {visibleDogs.length} dog{visibleDogs.length !== 1 ? 's' : ''} in your kennel
            {!user && " (active dogs only)"}
            {editMode && user && (
              <span className="block mt-1 text-blue-600">
                Active dogs are pre-selected. Inactive dogs are also visible for editing. Click to select/deselect dogs, then save to update their status.
                {selectedDogs.size > 0 && (
                  <span className="block mt-1">
                    {selectedDogs.size} dogs will be active, {visibleDogs.length - selectedDogs.size} will be inactive.
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {visibleDogs.map((myDog) => {
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
                  fallbackInitials={myDog.dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
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
      )}
    </div>
  );
}

export default DogsPage;
