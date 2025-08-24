import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dogService } from '../services/supabaseService';
import type { Dog } from '../services/supabaseService';
import Button from '../components/ui/Button';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import HorizontalTree, { type TreeNode } from '../components/HorizontalTree';
import { renderPedigreeNode, type PedigreeData } from '../components/Pedigree';
import { decodeDogId, createDogDetailPath } from '../utils/dogUtils';

function DogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError('Dog not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dog');
    } finally {
      setLoading(false);
    }
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

  // Build pedigree tree for father's line
  const buildFatherTree = (): TreeNode<PedigreeData> | null => {
    // Filter for SIRE relationships only
    const sireRelationship = dog?.pedigree_sire?.find((rel: any) => rel.relationship_type === 'SIRE');
    const sire = sireRelationship?.parent;
    if (!sire) return null;

    // TODO: In future iterations, we could recursively build deeper generations
    // For now, we'll build a simple 2-generation tree
    return {
      data: dogToPedigreeData(sire, 'Father'),
      children: [] // Would add grandparents here in future
    };
  };

  // Build pedigree tree for mother's line
  const buildMotherTree = (): TreeNode<PedigreeData> | null => {
    // Filter for DAM relationships only
    const damRelationship = dog?.pedigree_dam?.find((rel: any) => rel.relationship_type === 'DAM');
    const dam = damRelationship?.parent;
    if (!dam) return null;

    return {
      data: dogToPedigreeData(dam, 'Mother'),
      children: [] // Would add grandparents here in future
    };
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dog Image Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Typography variant="h1" color="muted" className="select-none">
                {dog.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Typography>
            </div>
            <Typography variant="caption" color="muted" className="text-center block">
              Photo coming soon
            </Typography>
          </div>

          {/* My Dogs Info */}
          {dog.my_dogs && dog.my_dogs.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <Typography variant="h5" className="mb-2">🏆 My Kennel</Typography>
              <Typography variant="body" color="muted">
                This dog is part of your kennel.
              </Typography>
              {dog.my_dogs[0].acquisition_date && (
                <Typography variant="caption" color="muted" className="block mt-2">
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

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Typography variant="h5" className="mb-4">Quick Stats</Typography>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Typography variant="caption" color="muted">Titles</Typography>
                <Typography variant="caption">{dog.titles?.length || 0}</Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="caption" color="muted">Offspring</Typography>
                <Typography variant="caption">
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
        
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Typography variant="h4" className="mb-4">Basic Information</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Titles */}
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

          {/* Pedigree */}
          {(() => {
            const fatherTree = buildFatherTree();
            const motherTree = buildMotherTree();
            const hasPedigree = fatherTree || motherTree;
            
            if (!hasPedigree) return null;
            
            return (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Typography variant="h4" className="mb-6">Pedigree</Typography>
                <div className="space-y-8">
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

        
      </div>
    </div>
  );
}

export default DogDetailsPage;
