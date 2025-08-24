import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DogCard from '../components/DogCard';
import { DogForm } from '../components/DogForm';
import Button from '../components/ui/Button';
import { dogService } from '../services/supabaseService';
import type { MyDog } from '../services/supabaseService';
import { createDogDetailPath } from '../utils/dogUtils';

function DogsPage() {
  const navigate = useNavigate();
  const [myDogs, setMyDogs] = useState<MyDog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyDogs();
  }, []);

  const loadMyDogs = async () => {
    try {
      setLoading(true);
      const dogs = await dogService.getMyDogs();
      setMyDogs(dogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDogSaved = () => {
    setShowAddForm(false);
    loadMyDogs(); // Refresh the list
  };

  const handleDogClick = (dogId: string) => {
    navigate(createDogDetailPath(dogId));
  };

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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Dogs</h1>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
        >
          Add New Dog
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Dog</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
          <DogForm onSave={handleDogSaved} />
        </div>
      )}

      {myDogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            You haven't added any dogs yet.
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Dog
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-4">
            {myDogs.length} dog{myDogs.length !== 1 ? 's' : ''} in your kennel
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myDogs.map((myDog) => {
              if (!myDog.dog) return null;
              
              return (
                <DogCard
                  key={myDog.dog.id}
                  name={myDog.dog.name}
                  breed={myDog.dog.breed?.name || 'Unknown Breed'}
                  imageUrl={undefined} // We don't have images in the data yet
                  imageAlt={`${myDog.dog.name} - ${myDog.dog.breed?.name}`}
                  fallbackInitials={myDog.dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  subtitle={myDog.dog.nickname ? `"${myDog.dog.nickname}"` : undefined}
                  metadata={[
                    myDog.dog.gender === 'M' ? 'Male' : 'Female',
                    myDog.dog.birth_date ? new Date(myDog.dog.birth_date).getFullYear().toString() : undefined,
                    myDog.acquisition_date ? `Acquired: ${new Date(myDog.acquisition_date).toLocaleDateString()}` : undefined
                  ].filter((item): item is string => Boolean(item))}
                  dogId={myDog.dog.id}
                  onDogClick={handleDogClick}
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
