import React, { useEffect, useMemo, useState } from 'react';
import Typography from './ui/Typography';
import { personService } from '../services/supabaseService';
import type { Person } from '../services/supabaseService';

interface PersonSelectorProps {
  label?: string;
  selectedPersonId: string | null;
  onSelect: (personId: string) => void;
  onAddNewPerson?: () => void;
  error?: string;
  className?: string;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  label = 'Owner Person',
  selectedPersonId,
  onSelect,
  onAddNewPerson,
  error,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await personService.getPersons();
        setPersons(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPersons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter(p =>
      p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [persons, searchTerm]);

  const selected = selectedPersonId ? persons.find(p => p.id === selectedPersonId) : undefined;

  const handleSelect = (p: Person) => {
    onSelect(p.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 text-left border rounded-md bg-white flex justify-between items-center ${
            error ? 'border-red-500' : 'border-gray-300'
          } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
            {selected ? (
              <span>
                {selected.name} <span className="text-gray-500">({selected.id})</span>
              </span>
            ) : (
              'Select a person...'
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
                placeholder="Search persons by id or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Persons list */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-gray-500 text-center">Loading...</div>
              ) : filteredPersons.length > 0 ? (
                filteredPersons.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                      selectedPersonId === p.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.id}{p.type ? ` • ${p.type}` : ''}</div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-center">
                  {searchTerm ? (
                    <>
                      No persons found matching "{searchTerm}"
                      {onAddNewPerson && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onAddNewPerson();
                              setIsOpen(false);
                            }}
                            className="text-green-600 hover:text-green-700 underline"
                          >
                            Add "{searchTerm}" as new person?
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    'No persons available'
                  )}
                </div>
              )}

              {/* Add New Person Button - at the bottom */}
              {onAddNewPerson && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewPerson();
                      setIsOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none text-green-700"
                  >
                    <div className="font-medium flex items-center">
                      <span className="mr-2">+</span>
                      Add New Person
                    </div>
                    <div className="text-sm text-green-600">
                      Create a new person entry
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

export default PersonSelector;


