import React, { useState } from 'react';
import type { Breed } from '../services/supabaseService';
import Typography from './ui/Typography';

interface BreedSelectorProps {
  breeds: Breed[];
  selectedBreedId: number | null;
  onSelect: (breedId: number) => void;
  onAddNewBreed?: () => void;
  error?: string;
  className?: string;
}

export const BreedSelector: React.FC<BreedSelectorProps> = ({
  breeds,
  selectedBreedId,
  onSelect,
  onAddNewBreed,
  error,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredBreeds = breeds.filter(breed =>
    breed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (breed.fci_number && breed.fci_number.includes(searchTerm))
  );

  const selectedBreed = breeds.find(breed => breed.id === selectedBreedId);

  const handleSelect = (breed: Breed) => {
    onSelect(breed.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Breed *
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 text-left border rounded-md bg-white flex justify-between items-center ${
            error ? 'border-red-500' : 'border-gray-300'
          } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        >
          <span className={selectedBreed ? 'text-gray-900' : 'text-gray-500'}>
            {selectedBreed ? (
              <span>
                {selectedBreed.name}
                {selectedBreed.fci_number && (
                  <span className="text-gray-500 ml-2">
                    (FCI #{selectedBreed.fci_number})
                  </span>
                )}
              </span>
            ) : (
              'Select a breed...'
            )}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search breeds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Breed list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredBreeds.length > 0 ? (
                filteredBreeds.map((breed) => (
                  <button
                    key={breed.id}
                    type="button"
                    onClick={() => handleSelect(breed)}
                    className={`w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                      selectedBreedId === breed.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{breed.name}</div>
                    {breed.fci_number && (
                      <div className="text-sm text-gray-500">
                        FCI #{breed.fci_number}
                        {breed.club_name && ` • ${breed.club_name}`}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-center">
                  {searchTerm ? (
                    <>
                      No breeds found matching "{searchTerm}"
                      {onAddNewBreed && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onAddNewBreed();
                              setIsOpen(false);
                            }}
                            className="text-green-600 hover:text-green-700 underline"
                          >
                            Add "{searchTerm}" as new breed?
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    'No breeds available'
                  )}
                </div>
              )}

              {/* Add New Breed Button - Now at the bottom */}
              {onAddNewBreed && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewBreed();
                      setIsOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none text-green-700"
                  >
                    <div className="font-medium flex items-center">
                      <span className="mr-2">+</span>
                      Add New Breed
                    </div>
                    <div className="text-sm text-green-600">
                      Create a new breed entry
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Typography variant="caption" className="text-red-500 mt-1">
          {error}
        </Typography>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
