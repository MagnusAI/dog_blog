import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { dogService } from '../services/supabaseService';
import type { Dog, Title } from '../services/supabaseService';
import { decodeDogId } from '../utils/dogUtils';
import { useTranslation } from '../contexts/LanguageContext';

interface TitlesEditFormProps {
  dogId: string;
  onClose?: () => void;
}

interface TitleFormData {
  title_code: string;
  year_earned?: number;
}

function TitlesEditForm({ dogId, onClose }: TitlesEditFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const [dog, setDog] = useState<Dog | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState<TitleFormData>({
    title_code: '',
    year_earned: undefined
  });
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);

  useEffect(() => {
    loadDogTitles();
  }, [dogId]);

  const loadDogTitles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Decode the dog ID to handle encoded special characters like forward slashes
      const decodedDogId = decodeDogId(dogId);
      const dogData = await dogService.getDogById(decodedDogId);
      if (!dogData) {
        setError(t('dogs.messages.dogNotFound'));
        return;
      }
      
      setDog(dogData);
      setTitles(dogData.titles || []);
    } catch (err) {
      console.error('Error loading dog titles:', err);
      setError(t('forms.messages.loadError', 'forms'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTitle = async () => {
    if (!newTitle.title_code.trim()) {
      setError(t('titles.messages.titleCodeRequired'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Decode the dog ID to handle encoded special characters like forward slashes
      const decodedDogId = decodeDogId(dogId);
      await dogService.addTitle(decodedDogId, {
        title_code: newTitle.title_code.trim(),
        year_earned: newTitle.year_earned
      });
      
      setSuccess(t('titles.messages.titleAdded'));
      setNewTitle({ title_code: '', year_earned: undefined });
      await loadDogTitles(); // Reload to get updated data
    } catch (err) {
      console.error('Error adding title:', err);
      setError(t('forms.messages.saveError', 'forms'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!editingTitle) return;

    try {
      setSaving(true);
      setError(null);
      
      await dogService.updateTitle(editingTitle.id, {
        title_code: editingTitle.title_code,
        year_earned: editingTitle.year_earned
      });
      
      setSuccess(t('titles.messages.titleUpdated'));
      setEditingTitle(null);
      await loadDogTitles(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating title:', err);
      setError(t('forms.messages.saveError', 'forms'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTitle = async (titleId: number) => {
    if (!confirm(t('forms.messages.confirmDelete', 'forms'))) return;

    try {
      setSaving(true);
      setError(null);
      
      await dogService.deleteTitle(titleId);
      setSuccess(t('titles.messages.titleDeleted'));
      await loadDogTitles(); // Reload to get updated data
    } catch (err) {
      console.error('Error deleting title:', err);
      setError(t('forms.messages.deleteError', 'forms'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Typography variant="body" color="secondary">{t('actions.loading', 'common')}</Typography>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dog) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Typography variant="h2" weight="bold" className="text-2xl text-gray-900 mb-4">
              {t('dogs.messages.dogNotFound')}
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {error}
            </Typography>
            <Button variant="primary" onClick={handleCancel}>
              {t('actions.back', 'common')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography variant="h1" weight="bold" className="text-3xl md:text-4xl text-gray-900 mb-2">
              {t('titles.title')}
            </Typography>
            {dog && (
              <Typography variant="body" color="secondary">
                {dog.name} ({dog.id})
              </Typography>
            )}
          </div>
          <Button variant="ghost" onClick={handleCancel}>
            ← {t('actions.back', 'common')}
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <Typography variant="body" className="text-red-700">{error}</Typography>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <Typography variant="body" className="text-green-700">{success}</Typography>
          </div>
        )}

        {/* Add New Title */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <Typography variant="h2" weight="semibold" className="text-xl text-gray-900 mb-4">
            {t('titles.sections.addNew')}
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('labels.titleCode', 'forms')} *
              </label>
              <input
                type="text"
                value={newTitle.title_code}
                onChange={(e) => setNewTitle({ ...newTitle, title_code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder={t('placeholders.enterTitleCode', 'forms')}
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('labels.yearEarned', 'forms')}
              </label>
              <select
                value={newTitle.year_earned || ''}
                onChange={(e) => setNewTitle({ ...newTitle, year_earned: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={saving}
              >
                <option value="">{t('placeholders.selectYear', 'forms')}</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            variant="primary" 
            onClick={handleAddTitle}
            disabled={saving || !newTitle.title_code.trim()}
          >
            {saving ? t('titles.messages.adding') : t('titles.messages.addTitle')}
          </Button>
        </div>

        {/* Existing Titles */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <Typography variant="h2" weight="semibold" className="text-xl text-gray-900 mb-4">
            {t('titles.sections.current', { count: titles.length })}
          </Typography>
          
          {titles.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="body" color="secondary">
                {t('titles.messages.noTitles')}
              </Typography>
            </div>
          ) : (
            <div className="space-y-4">
              {titles.map((title) => (
                <div
                  key={title.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  {editingTitle?.id === title.id ? (
                    // Edit mode
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={editingTitle.title_code}
                          onChange={(e) => setEditingTitle({ ...editingTitle, title_code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <select
                          value={editingTitle.year_earned || ''}
                          onChange={(e) => setEditingTitle({ ...editingTitle, year_earned: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          disabled={saving}
                        >
                          <option value="">No year</option>
                          {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-base">
                        {title.title_code}
                        {title.year_earned && ` (${title.year_earned})`}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex gap-2 ml-4">
                    {editingTitle?.id === title.id ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleUpdateTitle}
                          disabled={saving || !editingTitle.title_code.trim()}
                        >
                          {t('actions.save', 'common')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTitle(null)}
                          disabled={saving}
                        >
                          {t('actions.cancel', 'common')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTitle(title)}
                          disabled={saving || editingTitle !== null}
                        >
                          {t('actions.edit', 'common')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTitle(title.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          {t('actions.delete', 'common')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Typography variant="caption" className="text-blue-800">
            {t('titles.messages.helpText')}
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default TitlesEditForm;
