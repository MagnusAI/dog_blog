import React, { useState } from 'react';
import { DogForm } from './DogForm';
import type { Dog } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';

/**
 * Demo component showing how to use the DogForm
 * This can be integrated into your main app or used as a standalone page
 */
export const DogFormDemo: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingDogId, setEditingDogId] = useState<string | undefined>();
  const [savedDogs, setSavedDogs] = useState<Dog[]>([]);

  const handleCreateDog = () => {
    setMode('create');
    setEditingDogId(undefined);
  };

  const handleEditDog = (dogId: string) => {
    setMode('edit');
    setEditingDogId(dogId);
  };

  const handleDogSaved = (dog: Dog) => {
    // Update local state (in a real app, you might refetch from the server)
    if (mode === 'create') {
      setSavedDogs(prev => [...prev, dog]);
    } else {
      setSavedDogs(prev => prev.map(d => d.id === dog.id ? dog : d));
    }
    
    // Return to list view
    setMode('list');
    setEditingDogId(undefined);
    
    // Show success message (you might want to use a toast library)
    alert(`Dog ${mode === 'create' ? 'created' : 'updated'} successfully!`);
  };

  const handleCancel = () => {
    setMode('list');
    setEditingDogId(undefined);
  };

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <DogForm
            onSave={handleDogSaved}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  if (mode === 'edit' && editingDogId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <DogForm
            dogId={editingDogId}
            onSave={handleDogSaved}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h1">Dog Management System</Typography>
            <Button onClick={handleCreateDog}>
              Add New Dog
            </Button>
          </div>

          {/* Environment Setup Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Typography variant="h3" className="text-blue-800 mb-2">
              Setup Instructions
            </Typography>
            <Typography variant="body" className="text-blue-700 mb-2">
              Before using the dog form, make sure you have set up your environment variables:
            </Typography>
            <div className="bg-blue-100 p-3 rounded text-sm font-mono text-blue-800">
              <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</div>
            </div>
            <Typography variant="caption" className="text-blue-600 mt-2">
              Find these values in your Supabase dashboard under Settings → API
            </Typography>
          </div>

          {/* Features Overview */}
          <div className="mb-8">
            <Typography variant="h3" className="mb-4">
              Features Included
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Typography variant="h4" className="text-green-800 mb-2">
                  ✓ Basic Info
                </Typography>
                <Typography variant="body" className="text-green-700 text-sm">
                  Name, ID, breed, gender, birth/death dates, color
                </Typography>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Typography variant="h4" className="text-blue-800 mb-2">
                  ✓ Titles
                </Typography>
                <Typography variant="body" className="text-blue-700 text-sm">
                  Championships, show titles with years and countries
                </Typography>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Typography variant="h4" className="text-purple-800 mb-2">
                  ✓ Pedigree
                </Typography>
                <Typography variant="body" className="text-purple-700 text-sm">
                  Parent relationships, multiple generations supported
                </Typography>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Typography variant="h4" className="text-orange-800 mb-2">
                  ✓ Ownership
                </Typography>
                <Typography variant="body" className="text-orange-700 text-sm">
                  Mark as "my dog" with acquisition details and notes
                </Typography>
              </div>
            </div>
          </div>

          {/* Sample dogs for testing */}
          <div className="mb-6">
            <Typography variant="h3" className="mb-4">
              Sample Dogs for Testing
            </Typography>
            <Typography variant="body" className="text-gray-600 mb-4">
              Click "Edit" to see the form populated with sample data, or click "Add New Dog" to create a new dog from scratch.
            </Typography>
            
            <div className="space-y-3">
              {[
                {
                  id: 'DK12345/2024',
                  name: 'Sample Norfolk Terrier',
                  breed: 'Norfolk Terrier',
                  gender: 'M'
                },
                {
                  id: 'DK67890/2023',
                  name: 'Example Jack Russell',
                  breed: 'Jack Russell Terrier',
                  gender: 'F'
                }
              ].map((sampleDog) => (
                <div
                  key={sampleDog.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg"
                >
                  <div>
                    <Typography variant="h4">
                      {sampleDog.name}
                    </Typography>
                    <Typography variant="body" className="text-gray-600">
                      {sampleDog.id} • {sampleDog.breed} • {sampleDog.gender === 'M' ? 'Male' : 'Female'}
                    </Typography>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditDog(sampleDog.id)}
                    >
                      Edit (Demo)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved dogs display */}
          {savedDogs.length > 0 && (
            <div>
              <Typography variant="h3" className="mb-4">
                Recently Saved Dogs
              </Typography>
              <div className="space-y-3">
                {savedDogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg"
                  >
                    <div>
                      <Typography variant="h4">
                        {dog.name}
                      </Typography>
                      <Typography variant="body" className="text-gray-600">
                        {dog.id} • {dog.breed?.name} • {dog.gender === 'M' ? 'Male' : 'Female'}
                      </Typography>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditDog(dog.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedDogs.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              <Typography variant="body">
                No dogs saved yet. Click "Add New Dog" to get started!
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
