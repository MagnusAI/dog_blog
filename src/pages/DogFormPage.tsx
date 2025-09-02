import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DogForm } from '../components/DogForm';
import Button from '../components/ui/Button';
import { dogService, type Dog } from '../services/supabaseService';


function DogFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogExists, setDogExists] = useState<boolean | null>(null);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      checkDogExists(id);
    }
  }, [id, isEditMode]);

  const checkDogExists = async (dogId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the dog exists and if user has access to it
      const myDogs = await dogService.getMyDogs();
      const myDog = myDogs.find(md => md.dog?.id === dogId);
      
      if (!myDog) {
        setError('Dog not found or you do not have permission to edit this dog.');
        setDogExists(false);
        return;
      }

      setDogExists(true);
    } catch (err) {
      console.error('Error checking dog access:', err);
      setError('Failed to load dog information. Please try again.');
      setDogExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDogSave = (_dog: Dog) => {
    // Navigate back to dogs page after successful save
    navigate('/dogs');
  };

  const handleCancel = () => {
    navigate('/dogs');
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

  if (error || (isEditMode && dogExists === false)) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/dogs')}>
              Back to Dogs
            </Button>
            {isEditMode && (
              <Button 
                variant="secondary" 
                onClick={() => checkDogExists(id!)}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Don't render the form until we've confirmed access in edit mode
  if (isEditMode && dogExists === null) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Verifying access...</span>
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
            {isEditMode ? 'Edit Dog' : 'Add New Dog'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? 'Update your dog\'s information and settings below.'
              : 'Add a new dog to your kennel registry with all the important details.'
            }
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleCancel}
        >
          ← Back to Dogs
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border">
        <DogForm
          dogId={isEditMode ? id : undefined}
          onSave={handleDogSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

export default DogFormPage;
