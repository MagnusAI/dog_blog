import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dogService } from '../services/supabaseService';
import type { Dog } from '../services/supabaseService';
import Button from '../components/ui/Button';
import Typography from '../components/ui/Typography';
import PedigreeForm from '../components/PedigreeForm';
import { useAuth } from '../contexts/AuthContext';
import { decodeDogId, createDogDetailPath } from '../utils/dogUtils';

function PedigreeFormPage() {
  const navigate = useNavigate();
  const { dogId, lineType } = useParams<{ dogId: string; lineType: 'father' | 'mother' }>();
  const { user } = useAuth();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dogId || !lineType) {
      setError('Invalid parameters');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('You must be logged in to edit pedigree information');
      setLoading(false);
      return;
    }

    loadDog();
  }, [dogId, lineType, user]);

  const loadDog = async () => {
    if (!dogId) return;
    
    try {
      setLoading(true);
      // Decode the dog ID to handle encoded special characters
      const decodedDogId = decodeDogId(dogId);
      const dogData = await dogService.getDogById(decodedDogId);
      
      if (dogData) {
        setDog(dogData);
      } else {
        setError('Dog not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dog');
    } finally {
      setLoading(false);
    }
  };

  const handlePedigreeSave = (updatedDog: Dog) => {
    // Navigate back to the dog details page after saving
    navigate(createDogDetailPath(updatedDog.id));
  };

  const handlePedigreeCancel = () => {
    // Navigate back to the dog details page
    if (dog) {
      navigate(createDogDetailPath(dog.id));
    } else {
      navigate('/dogs');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4">Loading dog and pedigree data...</Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4" color="danger" className="mb-4">
            {error}
          </Typography>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/dogs')}>
              Back to Dogs
            </Button>
            {dogId && (
              <Button 
                variant="secondary" 
                onClick={() => navigate(createDogDetailPath(decodeDogId(dogId)))}
              >
                Back to Dog Details
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!dog || !lineType) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4" color="danger" className="mb-4">
            Invalid request
          </Typography>
          <Button onClick={() => navigate('/dogs')}>
            Back to Dogs
          </Button>
        </div>
      </div>
    );
  }

  const lineTitle = lineType === 'father' ? "Father's Line" : "Mother's Line";

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(createDogDetailPath(dog.id))}
            className="mb-4"
          >
            ← Back to {dog.name}
          </Button>
          <Typography variant="h2" className="mb-2">
            Edit {lineTitle}
          </Typography>
          <Typography variant="h4" color="muted">
            for {dog.name}
          </Typography>
        </div>
      </div>

      {/* Pedigree Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <PedigreeForm
            currentDog={dog}
            pedigreeType={lineType}
            onSave={handlePedigreeSave}
            onCancel={handlePedigreeCancel}
          />
        </div>
      </div>
    </div>
  );
}

export default PedigreeFormPage;
