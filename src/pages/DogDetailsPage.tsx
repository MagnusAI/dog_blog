import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dogService } from '../services/supabaseService';
import type { Dog, DogImage } from '../services/supabaseService';
import Button from '../components/ui/Button';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import HorizontalTree, { type TreeNode } from '../components/HorizontalTree';
import { renderPedigreeNode, type PedigreeData } from '../components/Pedigree';
import { decodeDogId, createDogDetailPath } from '../utils/dogUtils';
import { useAuth } from '../contexts/AuthContext';
import { DogForm } from '../components/DogForm';

function DogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dog, setDog] = useState<Dog | null>(null);
  const [profileImage, setProfileImage] = useState<DogImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No dog ID provided');
      setLoading(false);
      return;
    }

    loadDog();
  }, [id]);

  const loadDog = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Decode the dog ID to handle encoded special characters like forward slashes
      const decodedDogId = decodeDogId(id);
      const dogData = await dogService.getDogById(decodedDogId);
      if (dogData) {
        setDog(dogData);
        
        // Load profile image if available
        try {
          const imageData = await dogService.getDogProfileImage(decodedDogId);
          setProfileImage(imageData);
        } catch (error) {
          console.info('Profile image not available for this dog');
          setProfileImage(null);
        }
      } else {
        setError('Dog not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dog');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditSave = (updatedDog: Dog) => {
    setDog(updatedDog);
    setShowEditForm(false);
    // Optionally show a success message
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      return `${years - 1} years old`;
    }
    return `${years} years old`;
  };

  // Helper function to convert dog data to pedigree data format
  const dogToPedigreeData = (dog: any, relation: string): PedigreeData => {
    return {
      relation,
      name: dog.name,
      titles: dog.titles?.map((t: any) => t.title_code) || [],
      regnr: dog.id,
      fallbackInitials: dog.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2),
      imageUrl: undefined // We'll use fallback initials for now
    };
  };

  // Custom render function for pedigree nodes with navigation
  const renderClickablePedigreeNode = (data: PedigreeData, level: number) => {
    const handlePedigreeClick = () => {
      navigate(createDogDetailPath(data.regnr));
    };

    return (
      <div onClick={handlePedigreeClick} className="cursor-pointer">
        {renderPedigreeNode(data, level)}
      </div>
    );
  };

  // Build multi-generation pedigree tree for father's line
  const buildFatherTree = (): TreeNode<PedigreeData> | null => {
    if (!dog?.all_ancestors) return null;

    // Get the father (generation 1, SIRE)
    const father = dog.all_ancestors.find(a => a.generation === 1 && a.relationship_type === 'SIRE');
    if (!father) return null;

    // Get all paternal ancestors (assuming the first half are paternal lineage)
    const paternalAncestors = dog.all_ancestors.filter(a => a.generation >= 2).slice(0, Math.floor(dog.all_ancestors.filter(a => a.generation >= 2).length / 2));
    
    // Build children for the father
    const fatherChildren: TreeNode<PedigreeData>[] = [];
    
    // Add generation 2 (grandparents)
    const generation2Paternal = paternalAncestors.filter(a => a.generation === 2).slice(0, 2);
    generation2Paternal.forEach(grandparent => {
      const generation3Children = paternalAncestors
        .filter(a => a.generation === 3)
        .slice(0, 2)
        .map(greatGrandparent => ({
          data: dogToPedigreeData(greatGrandparent.parent, getRelationLabel(greatGrandparent.relationship_type, 3)),
          children: []
        }));

      fatherChildren.push({
        data: dogToPedigreeData(grandparent.parent, getRelationLabel(grandparent.relationship_type, 2)),
        children: generation3Children
      });
    });

    return {
      data: dogToPedigreeData(father.parent, 'Father'),
      children: fatherChildren
    };
  };

  // Build multi-generation pedigree tree for mother's line  
  const buildMotherTree = (): TreeNode<PedigreeData> | null => {
    if (!dog?.all_ancestors) return null;

    // Get the mother (generation 1, DAM)
    const mother = dog.all_ancestors.find(a => a.generation === 1 && a.relationship_type === 'DAM');
    if (!mother) return null;

    // Get all maternal ancestors (assuming the second half are maternal lineage)
    const allGenerationTwoPlusAncestors = dog.all_ancestors.filter(a => a.generation >= 2);
    const maternalAncestors = allGenerationTwoPlusAncestors.slice(Math.floor(allGenerationTwoPlusAncestors.length / 2));
    
    // Build children for the mother
    const motherChildren: TreeNode<PedigreeData>[] = [];
    
    // Add generation 2 (grandparents)
    const generation2Maternal = maternalAncestors.filter(a => a.generation === 2).slice(0, 2);
    generation2Maternal.forEach(grandparent => {
      const generation3Children = maternalAncestors
        .filter(a => a.generation === 3)
        .slice(0, 2)
        .map(greatGrandparent => ({
          data: dogToPedigreeData(greatGrandparent.parent, getRelationLabel(greatGrandparent.relationship_type, 3)),
          children: []
        }));

      motherChildren.push({
        data: dogToPedigreeData(grandparent.parent, getRelationLabel(grandparent.relationship_type, 2)),
        children: generation3Children
      });
    });

    return {
      data: dogToPedigreeData(mother.parent, 'Mother'),
      children: motherChildren
    };
  };

  // Helper function to get appropriate relation label
  const getRelationLabel = (relationshipType: 'SIRE' | 'DAM', generation: number): string => {
    if (generation === 1) {
      return relationshipType === 'SIRE' ? 'Father' : 'Mother';
    } else if (generation === 2) {
      return relationshipType === 'SIRE' ? 'Grandfather' : 'Grandmother';
    } else if (generation === 3) {
      return relationshipType === 'SIRE' ? 'Great-Grandfather' : 'Great-Grandmother';
    }
    return 'Ancestor';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4">Loading dog details...</Typography>
        </div>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Typography variant="h4" color="danger" className="mb-4">
            {error || 'Dog not found'}
          </Typography>
          <Button onClick={() => navigate('/dogs')}>
            Back to Dogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dogs')}
            className="mb-4"
          >
            ← Back to Dogs
          </Button>
          <Typography variant="h2" className="mb-2">
            {dog.name}
          </Typography>
          {dog.nickname && (
            <Typography variant="h4" color="muted" className="italic">
              "{dog.nickname}"
            </Typography>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-3">
            {/* Edit Button - Only visible for authenticated users */}
            {user && (
              <Button
                variant="primary"
                onClick={handleEditClick}
                className="mb-2"
              >
                ✏️ Edit Dog
              </Button>
            )}
            <div>
              <Badge variant={dog.gender === 'M' ? 'primary' : 'secondary'}>
                {dog.gender === 'M' ? 'Male' : 'Female'}
              </Badge>
              {dog.is_deceased && (
                <Badge variant="danger" className="ml-2">
                  Deceased
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Row: Photo and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Dog Image */}
        <div className="bg-white p-6 rounded-lg shadow-sm border h-full flex flex-col">
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage.image_url}
                alt={profileImage.alt_text || `${dog.name} profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="text-4xl text-gray-400">${dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                    </div>
                  `;
                }}
              />
            ) : (
              <Typography variant="h1" color="muted" className="select-none">
                {dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Typography>
            )}
          </div>
          <Typography variant="caption" color="muted" className="text-center block">
            {profileImage ? 'Profile Photo' : 'Photo coming soon'}
          </Typography>
          
          {/* My Dogs Info */}
          {dog.my_dogs && dog.my_dogs.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <Typography variant="h6" className="mb-2">🏆 My Kennel</Typography>
              <Typography variant="caption" color="muted">
                This dog is part of your kennel.
              </Typography>
              {dog.my_dogs[0].acquisition_date && (
                <Typography variant="caption" color="muted" className="block mt-1">
                  Acquired: {formatDate(dog.my_dogs[0].acquisition_date)}
                </Typography>
              )}
              {dog.my_dogs[0].notes && (
                <Typography variant="caption" color="muted" className="block mt-1">
                  Notes: {dog.my_dogs[0].notes}
                </Typography>
              )}
            </div>
          )}
        </div>

        {/* Basic Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border h-full md:col-span-2">
          <Typography variant="h4" className="mb-4">Basic Information</Typography>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Typography variant="caption" color="muted">Breed</Typography>
              <Typography variant="body">{dog.breed?.name || 'Unknown'}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">Registration ID</Typography>
              <Typography variant="body" className="font-mono">{dog.id}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">Birth Date</Typography>
              <Typography variant="body">{formatDate(dog.birth_date)}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">Age</Typography>
              <Typography variant="body">{calculateAge(dog.birth_date)}</Typography>
            </div>
            {dog.color && (
              <div>
                <Typography variant="caption" color="muted">Color</Typography>
                <Typography variant="body">{dog.color}</Typography>
              </div>
            )}
            {dog.death_date && (
              <div>
                <Typography variant="caption" color="muted">Death Date</Typography>
                <Typography variant="body">{formatDate(dog.death_date)}</Typography>
              </div>
            )}
            <div>
              <Typography variant="caption" color="muted">Titles</Typography>
              <Typography variant="body">{dog.titles?.length || 0}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">Offspring</Typography>
              <Typography variant="body">
                {(() => {
                  const sireCount = dog.offspring_as_sire?.filter((rel: any) => rel.relationship_type === 'SIRE').length || 0;
                  const damCount = dog.offspring_as_dam?.filter((rel: any) => rel.relationship_type === 'DAM').length || 0;
                  return sireCount + damCount;
                })()}
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Titles Section */}
      {dog.titles && dog.titles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Typography variant="h4" className="mb-4">Titles & Achievements</Typography>
          <div className="flex flex-wrap gap-2">
            {dog.titles.map((title, index) => (
              <Badge key={index} variant="secondary">
                {title.title_code}
                {title.year_earned && ` (${title.year_earned})`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Full Width Content */}
      <div className="space-y-6">

          {/* Pedigree */}
          {(() => {
            const fatherTree = buildFatherTree();
            const motherTree = buildMotherTree();
            const hasPedigree = fatherTree || motherTree;
            
            if (!hasPedigree) return null;
            
            return (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Typography variant="h4" className="mb-6">Pedigree (3 Generations)</Typography>
                {dog.all_ancestors && (
                  <Typography variant="caption" color="muted" className="block mb-4">
                    Total ancestors in database: {dog.all_ancestors.length}
                    {dog.all_ancestors.length > 0 && (
                      <span className="ml-2">
                        (Gen 1: {dog.all_ancestors.filter(a => a.generation === 1).length}, 
                         Gen 2: {dog.all_ancestors.filter(a => a.generation === 2).length}, 
                         Gen 3: {dog.all_ancestors.filter(a => a.generation === 3).length})
                      </span>
                    )}
                  </Typography>
                )}
                <div className="space-y-8 lg:flex gap-4 ">
                  {fatherTree && (
                    <div>
                      <Typography variant="h5" className="mb-4">Father's Line</Typography>
                      <div className="overflow-x-auto">
                        <HorizontalTree
                          tree={fatherTree}
                          renderNode={renderClickablePedigreeNode}
                          maxDepth={3}
                          lineStyle={{ color: "#e5e7eb", thickness: 2, style: "solid" }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {motherTree && (
                    <div>
                      <Typography variant="h5" className="mb-4">Mother's Line</Typography>
                      <div className="overflow-x-auto">
                        <HorizontalTree
                          tree={motherTree}
                          renderNode={renderClickablePedigreeNode}
                          maxDepth={3}
                          lineStyle={{ color: "#e5e7eb", thickness: 2, style: "solid" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Offspring */}
          {(() => {
            // Filter offspring by relationship type
            const sireOffspring = dog.offspring_as_sire?.filter((rel: any) => rel.relationship_type === 'SIRE') || [];
            const damOffspring = dog.offspring_as_dam?.filter((rel: any) => rel.relationship_type === 'DAM') || [];
            const hasOffspring = sireOffspring.length > 0 || damOffspring.length > 0;
            
            if (!hasOffspring) return null;
            
            return (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Typography variant="h4" className="mb-4">Offspring</Typography>
                <div className="space-y-4">
                  {sireOffspring.length > 0 && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {sireOffspring.slice(0, 6).map((rel: any) => (
                          <button
                            key={`sire-${rel.offspring.id}`}
                            onClick={() => navigate(createDogDetailPath(rel.offspring.id))}
                            className="text-left p-2 border rounded hover:bg-gray-50 transition-colors"
                          >
                            <Typography variant="caption" weight="semibold">
                              {rel.offspring.name}
                            </Typography>
                            <Typography variant="caption" color="muted" className="block">
                              {rel.offspring.breed?.name}
                            </Typography>
                          </button>
                        ))}
                        {sireOffspring.length > 6 && (
                          <Typography variant="caption" color="muted">
                            ...and {sireOffspring.length - 6} more
                          </Typography>
                        )}
                      </div>
                    </div>
                  )}

                  {damOffspring.length > 0 && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {damOffspring.slice(0, 6).map((rel: any) => (
                          <button
                            key={`dam-${rel.offspring.id}`}
                            onClick={() => navigate(createDogDetailPath(rel.offspring.id))}
                            className="text-left p-2 border rounded hover:bg-gray-50 transition-colors"
                          >
                            <Typography variant="caption" weight="semibold">
                              {rel.offspring.name}
                            </Typography>
                            <Typography variant="caption" color="muted" className="block">
                              {rel.offspring.breed?.name}
                            </Typography>
                          </button>
                        ))}
                        {damOffspring.length > 6 && (
                          <Typography variant="caption" color="muted">
                            ...and {damOffspring.length - 6} more
                          </Typography>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Edit Form Modal - Only shown when editing */}
      {showEditForm && user && dog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 z-10">
              <div className="flex items-center justify-between">
                <Typography variant="h3">
                  Edit {dog.name}
                </Typography>
                <Button
                  variant="ghost"
                  onClick={handleEditCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <DogForm
                dogId={dog.id}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DogDetailsPage;
