import React, { useState, useEffect } from 'react';
import { dogService } from '../services/supabaseService';
import type { Dog, Breed, Title, PedigreeRelationship, MyDog } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';
import { BreedSelector } from './BreedSelector';
import { TitlesManager } from './TitlesManager';
import { PedigreeManager } from './PedigreeManager';
import { MyDogToggle } from './MyDogToggle';
import { BreedManager } from './BreedManager';

interface DogFormProps {
  dogId?: string; // If provided, we're editing; if not, we're creating
  onSave?: (dog: Dog) => void;
  onCancel?: () => void;
}

interface FormData {
  id: string;
  name: string;
  nickname: string;
  gender: 'M' | 'F';
  breed_id: number | null;
  birth_date: string;
  death_date: string;
  is_deceased: boolean;
  color: string;
  owner_person_id: string;
  original_dog_id: string;
}

const initialFormData: FormData = {
  id: '',
  name: '',
  nickname: '',
  gender: 'M',
  breed_id: null,
  birth_date: '',
  death_date: '',
  is_deceased: false,
  color: '',
  owner_person_id: '',
  original_dog_id: ''
};

export const DogForm: React.FC<DogFormProps> = ({ dogId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [pedigreeRelationships, setPedigreeRelationships] = useState<PedigreeRelationship[]>([]);
  const [myDogRecord, setMyDogRecord] = useState<MyDog | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'titles' | 'pedigree' | 'ownership'>('basic');
  const [showBreedManager, setShowBreedManager] = useState(false);

  const isEditing = Boolean(dogId);

  useEffect(() => {
    loadInitialData();
  }, [dogId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load breeds
      const breedsData = await dogService.getBreeds();
      setBreeds(breedsData);

      if (dogId) {
        // Load existing dog data
        const dogData = await dogService.getDog(dogId);
        if (dogData) {
          setFormData({
            id: dogData.id,
            name: dogData.name,
            nickname: dogData.nickname || '',
            gender: dogData.gender,
            breed_id: dogData.breed_id,
            birth_date: dogData.birth_date || '',
            death_date: dogData.death_date || '',
            is_deceased: dogData.is_deceased,
            color: dogData.color || '',
            owner_person_id: dogData.owner_person_id || '',
            original_dog_id: dogData.original_dog_id || ''
          });

          // Load related data
          const [titlesData, pedigreeData] = await Promise.all([
            dogService.getDogTitles(dogId),
            dogService.getDogPedigree(dogId)
          ]);

          setTitles(titlesData);
          setPedigreeRelationships(pedigreeData);

          // Check if this is one of my dogs
          const myDogsData = await dogService.getMyDogs();
          const myDogRecord = myDogsData.find(md => md.dog_id === dogId);
          setMyDogRecord(myDogRecord || null);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setErrors({ general: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.id.trim() && !isEditing) {
      newErrors.id = 'ID is required for new dogs';
    }

    if (!formData.breed_id) {
      newErrors.breed_id = 'Breed is required';
    }

    if (formData.birth_date && formData.death_date) {
      const birthDate = new Date(formData.birth_date);
      const deathDate = new Date(formData.death_date);
      if (deathDate <= birthDate) {
        newErrors.death_date = 'Death date must be after birth date';
      }
    }

    if (formData.is_deceased && !formData.death_date) {
      newErrors.death_date = 'Death date is required when dog is marked as deceased';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const dogData = {
        ...formData,
        breed_id: formData.breed_id!,
        birth_date: formData.birth_date || undefined,
        death_date: formData.death_date || undefined,
        nickname: formData.nickname || undefined,
        color: formData.color || undefined,
        owner_person_id: formData.owner_person_id || undefined,
        original_dog_id: formData.original_dog_id || undefined
      };

      let savedDog: Dog;
      if (isEditing) {
        const { id, ...updates } = dogData;
        savedDog = await dogService.updateDog(dogId!, updates);
      } else {
        savedDog = await dogService.createDog(dogData);
      }

      onSave?.(savedDog);
    } catch (error) {
      console.error('Error saving dog:', error);
      setErrors({ general: 'Failed to save dog' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBreedAdded = (newBreed: Breed) => {
    setBreeds(prev => [...prev, newBreed]);
    setFormData(prev => ({ ...prev, breed_id: newBreed.id }));
    setShowBreedManager(false);
  };

  const handleDeceasedChange = (isDeceased: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_deceased: isDeceased,
      death_date: isDeceased ? prev.death_date : ''
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Typography variant="body">Loading...</Typography>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Typography variant="h2" className="mb-6">
        {isEditing ? `Edit ${formData.name}` : 'Add New Dog'}
      </Typography>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-700">
            {errors.general}
          </Typography>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { key: 'basic', label: 'Basic Info' },
          { key: 'titles', label: 'Titles' },
          { key: 'pedigree', label: 'Pedigree' },
          { key: 'ownership', label: 'Ownership' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dog ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dog ID *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  disabled={isEditing}
                  className={`w-full p-3 border rounded-md ${
                    errors.id ? 'border-red-500' : 'border-gray-300'
                  } ${isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="e.g., DK12345/2024"
                />
                {errors.id && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.id}
                  </Typography>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-3 border rounded-md ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full registered name"
                />
                {errors.name && (
                  <Typography variant="caption" className="text-red-500 mt-1">
                    {errors.name}
                  </Typography>
                )}
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname/Call Name
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Common name used at home"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as 'M' | 'F')}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              {/* Breed */}
              <div className="md:col-span-2">
                <BreedSelector
                  breeds={breeds}
                  selectedBreedId={formData.breed_id}
                  onSelect={(breedId: any) => handleInputChange('breed_id', breedId)}
                  onAddNewBreed={() => setShowBreedManager(true)}
                  error={errors.breed_id}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g., Red, Black, Grizzle"
                />
              </div>

              {/* Deceased Status */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_deceased}
                    onChange={(e) => handleDeceasedChange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Dog is deceased
                  </span>
                </label>
              </div>

              {/* Death Date */}
              {formData.is_deceased && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Death Date {formData.is_deceased ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    value={formData.death_date}
                    onChange={(e) => handleInputChange('death_date', e.target.value)}
                    className={`w-full p-3 border rounded-md ${
                      errors.death_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.death_date && (
                    <Typography variant="caption" className="text-red-500 mt-1">
                      {errors.death_date}
                    </Typography>
                  )}
                </div>
              )}

              {/* Owner Person ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Person ID
                </label>
                <input
                  type="text"
                  value={formData.owner_person_id}
                  onChange={(e) => handleInputChange('owner_person_id', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Owner identifier"
                />
              </div>

              {/* Original Dog ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Dog ID
                </label>
                <input
                  type="text"
                  value={formData.original_dog_id}
                  onChange={(e) => handleInputChange('original_dog_id', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="For tracking lineage changes"
                />
              </div>
            </div>
          </div>
        )}

        {/* Titles Tab */}
        {activeTab === 'titles' && isEditing && (
          <TitlesManager
            dogId={dogId!}
            titles={titles}
            onTitlesChange={setTitles}
          />
        )}

        {/* Pedigree Tab */}
        {activeTab === 'pedigree' && isEditing && (
          <PedigreeManager
            dogId={dogId!}
            relationships={pedigreeRelationships}
            onRelationshipsChange={setPedigreeRelationships}
          />
        )}

        {/* Ownership Tab */}
        {activeTab === 'ownership' && isEditing && (
          <MyDogToggle
            dogId={dogId!}
            myDogRecord={myDogRecord}
            onMyDogChange={setMyDogRecord}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="min-w-24"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Dog' : 'Create Dog'}
          </Button>
        </div>
      </form>

      {/* Breed Manager Modal */}
      {showBreedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BreedManager
            isModal={true}
            onBreedAdded={handleBreedAdded}
            onClose={() => setShowBreedManager(false)}
          />
        </div>
      )}
    </div>
  );
};
