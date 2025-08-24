import React, { useState } from 'react';
import { dogService } from '../services/supabaseService';
import type { PedigreeRelationship, Dog } from '../services/supabaseService';
import Button from './ui/Button';
import Typography from './ui/Typography';

interface PedigreeManagerProps {
  dogId: string;
  relationships: PedigreeRelationship[];
  onRelationshipsChange: (relationships: PedigreeRelationship[]) => void;
}

interface DogSearchProps {
  onSelect: (dog: Dog) => void;
  placeholder: string;
  selectedDog?: Dog | null;
}

const DogSearch: React.FC<DogSearchProps> = ({ onSelect, placeholder, selectedDog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Dog[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await dogService.searchDogs(term.trim());
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching dogs:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (dog: Dog) => {
    onSelect(dog);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-md"
      />
      
      {selectedDog && !searchTerm && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>{selectedDog.name}</strong> ({selectedDog.id})
          {selectedDog.breed && <span className="text-gray-600"> • {selectedDog.breed.name}</span>}
        </div>
      )}

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((dog) => (
              <button
                key={dog.id}
                type="button"
                onClick={() => handleSelect(dog)}
                className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{dog.name}</div>
                <div className="text-sm text-gray-500">
                  {dog.id}
                  {dog.breed && ` • ${dog.breed.name}`}
                  {dog.birth_date && ` • Born ${dog.birth_date}`}
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-gray-500">No dogs found matching "{searchTerm}"</div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showResults && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export const PedigreeManager: React.FC<PedigreeManagerProps> = ({
  dogId,
  relationships,
  onRelationshipsChange
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Dog | null>(null);
  const [relationshipType, setRelationshipType] = useState<'SIRE' | 'DAM'>('SIRE');
  const [generation, setGeneration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sire = relationships.find(r => r.relationship_type === 'SIRE' && r.generation === 1);
  const dam = relationships.find(r => r.relationship_type === 'DAM' && r.generation === 1);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedParent) {
      newErrors.parent = 'Please select a parent dog';
    }

    if (selectedParent?.id === dogId) {
      newErrors.parent = 'A dog cannot be its own parent';
    }

    // Check if this relationship already exists
    const existingRelationship = relationships.find(
      r => r.parent_id === selectedParent?.id && 
           r.relationship_type === relationshipType && 
           r.generation === generation
    );

    if (existingRelationship) {
      newErrors.parent = `This ${relationshipType.toLowerCase()} relationship already exists`;
    }

    // For generation 1, ensure we don't have multiple sires or dams
    if (generation === 1) {
      const existingParentOfType = relationships.find(
        r => r.relationship_type === relationshipType && r.generation === 1
      );
      if (existingParentOfType) {
        newErrors.parent = `This dog already has a ${relationshipType.toLowerCase()} recorded`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const relationshipData = {
        dog_id: dogId,
        parent_id: selectedParent!.id,
        relationship_type: relationshipType,
        generation
      };

      const newRelationship = await dogService.addPedigreeRelationship(relationshipData);
      
      // Add the parent info to the relationship for display
      const relationshipWithParent: PedigreeRelationship = {
        ...newRelationship,
        parent: selectedParent || undefined
      };

      onRelationshipsChange([...relationships, relationshipWithParent]);

      // Reset form
      setSelectedParent(null);
      setRelationshipType('SIRE');
      setGeneration(1);
      setShowAddForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error adding pedigree relationship:', error);
      setErrors({ general: 'Failed to add pedigree relationship' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (relationshipId: number) => {
    if (!confirm('Are you sure you want to remove this pedigree relationship?')) {
      return;
    }

    setLoading(true);
    try {
      await dogService.deletePedigreeRelationship(relationshipId);
      onRelationshipsChange(relationships.filter(r => r.id !== relationshipId));
    } catch (error) {
      console.error('Error deleting pedigree relationship:', error);
      setErrors({ general: 'Failed to delete pedigree relationship' });
    } finally {
      setLoading(false);
    }
  };

  const cancelAdd = () => {
    setSelectedParent(null);
    setRelationshipType('SIRE');
    setGeneration(1);
    setShowAddForm(false);
    setErrors({});
  };

  const groupedRelationships = relationships.reduce((acc, rel) => {
    const key = `gen${rel.generation}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rel);
    return acc;
  }, {} as Record<string, PedigreeRelationship[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h3">Pedigree Relationships</Typography>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
        >
          Add Parent
        </Button>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-700">
            {errors.general}
          </Typography>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <Typography variant="h4" className="mb-4">
            Add Parent Relationship
          </Typography>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Relationship Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type *
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as 'SIRE' | 'DAM')}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="SIRE">Sire (Father)</option>
                  <option value="DAM">Dam (Mother)</option>
                </select>
              </div>

              {/* Generation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation *
                </label>
                <select
                  value={generation}
                  onChange={(e) => setGeneration(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value={1}>1 (Parent)</option>
                  <option value={2}>2 (Grandparent)</option>
                  <option value={3}>3 (Great-grandparent)</option>
                  <option value={4}>4 (Great-great-grandparent)</option>
                </select>
              </div>
            </div>

            {/* Parent Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for Parent Dog *
              </label>
              <DogSearch
                onSelect={setSelectedParent}
                placeholder="Search by name or ID..."
                selectedDog={selectedParent}
              />
              {errors.parent && (
                <Typography variant="caption" className="text-red-500 mt-1">
                  {errors.parent}
                </Typography>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={cancelAdd}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedParent}
              >
                {loading ? 'Adding...' : 'Add Relationship'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Current Pedigree Display */}
      <div className="space-y-6">
        {/* Generation 1 (Parents) - Special display */}
        <div>
          <Typography variant="h4" className="mb-4">
            Parents
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sire */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Typography variant="h5" className="text-blue-700 mb-2">
                Sire (Father)
              </Typography>
              {sire ? (
                <div className="space-y-2">
                  <Typography variant="body" className="font-medium">
                    {sire.parent?.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    ID: {sire.parent?.id}
                  </Typography>
                  {sire.parent?.breed && (
                    <Typography variant="caption" className="text-gray-600">
                      Breed: {sire.parent.breed.name}
                    </Typography>
                  )}
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(sire.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Typography variant="body" className="text-gray-500">
                  No sire recorded
                </Typography>
              )}
            </div>

            {/* Dam */}
            <div className="p-4 border border-pink-200 rounded-lg bg-pink-50">
              <Typography variant="h5" className="text-pink-700 mb-2">
                Dam (Mother)
              </Typography>
              {dam ? (
                <div className="space-y-2">
                  <Typography variant="body" className="font-medium">
                    {dam.parent?.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    ID: {dam.parent?.id}
                  </Typography>
                  {dam.parent?.breed && (
                    <Typography variant="caption" className="text-gray-600">
                      Breed: {dam.parent.breed.name}
                    </Typography>
                  )}
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(dam.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Typography variant="body" className="text-gray-500">
                  No dam recorded
                </Typography>
              )}
            </div>
          </div>
        </div>

        {/* Other Generations */}
        {Object.entries(groupedRelationships)
          .filter(([key]) => key !== 'gen1')
          .sort(([a], [b]) => parseInt(a.replace('gen', '')) - parseInt(b.replace('gen', '')))
          .map(([genKey, genRelationships]) => {
            const genNumber = parseInt(genKey.replace('gen', ''));
            const genLabel = ['', 'Parents', 'Grandparents', 'Great-grandparents', 'Great-great-grandparents'][genNumber] || `Generation ${genNumber}`;
            
            return (
              <div key={genKey}>
                <Typography variant="h4" className="mb-4">
                  {genLabel}
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {genRelationships.map((relationship) => (
                    <div
                      key={relationship.id}
                      className={`p-4 border rounded-lg ${
                        relationship.relationship_type === 'SIRE' 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-pink-200 bg-pink-50'
                      }`}
                    >
                      <Typography variant="h5" className={`mb-2 ${
                        relationship.relationship_type === 'SIRE' ? 'text-blue-700' : 'text-pink-700'
                      }`}>
                        {relationship.relationship_type === 'SIRE' ? 'Sire Line' : 'Dam Line'}
                      </Typography>
                      <div className="space-y-2">
                        <Typography variant="body" className="font-medium">
                          {relationship.parent?.name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          ID: {relationship.parent?.id}
                        </Typography>
                        {relationship.parent?.breed && (
                          <Typography variant="caption" className="text-gray-600">
                            Breed: {relationship.parent.breed.name}
                          </Typography>
                        )}
                        <div className="mt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(relationship.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        {relationships.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            <Typography variant="body">
              No pedigree relationships recorded yet. Add the first parent above.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};
