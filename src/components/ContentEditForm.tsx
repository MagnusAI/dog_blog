import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { contentService } from '../services/supabaseService';
import type { ContentSection, ContentSectionUpdateData } from '../services/supabaseService';

interface ContentEditFormProps {
  sectionKey: string;
  onClose?: () => void;
}

function ContentEditForm({ sectionKey, onClose }: ContentEditFormProps) {
  const navigate = useNavigate();
  const [section, setSection] = useState<ContentSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    section_type: 'text' as 'text' | 'list' | 'card',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadSection();
  }, [sectionKey]);

  const loadSection = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getContentByKey(sectionKey);
      
      if (!data) {
        setError('Content section not found');
        return;
      }
      
      setSection(data);
      setFormData({
        title: data.title,
        content: data.content,
        section_type: data.section_type,
        sort_order: data.sort_order,
        is_active: data.is_active
      });
    } catch (err) {
      console.error('Error loading content section:', err);
      setError('Failed to load content section');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;

    try {
      setSaving(true);
      setError(null);
      
      const updateData: ContentSectionUpdateData = {
        title: formData.title,
        content: formData.content,
        section_type: formData.section_type,
        sort_order: formData.sort_order,
        is_active: formData.is_active
      };

      await contentService.updateContentSection(section.id, updateData);
      setSuccess('Content updated successfully');
      
      // Redirect back after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigate(-1); // Go back to previous page
        }
      }, 1500);
    } catch (err) {
      console.error('Error updating content:', err);
      setError('Failed to update content section');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Typography variant="body" color="secondary">Loading content...</Typography>
          </div>
        </div>
      </div>
    );
  }

  if (error && !section) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Typography variant="h2" weight="bold" className="text-2xl text-gray-900 mb-4">
              Content Not Found
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {error}
            </Typography>
            <Button variant="primary" onClick={handleCancel}>
              Go Back
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
              Edit Content Section
            </Typography>
            {section && (
              <Typography variant="body" color="secondary">
                {section.section_key} • {section.page} page
              </Typography>
            )}
          </div>
          <Button variant="ghost" onClick={handleCancel}>
            ← Back
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

        {/* Edit Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-lg"
                placeholder="Section title..."
                disabled={saving}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
                {formData.section_type === 'list' && (
                  <span className="text-gray-500 font-normal"> (Each line will be a separate list item)</span>
                )}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={formData.section_type === 'list' ? 10 : 8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-base leading-relaxed"
                placeholder={
                  formData.section_type === 'list' 
                    ? "Enter each list item on a new line...\nFirst item\nSecond item\nThird item"
                    : "Enter your content here...\n\nUse double line breaks to separate paragraphs."
                }
                disabled={saving}
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={formData.section_type}
                  onChange={(e) => setFormData({ ...formData, section_type: e.target.value as 'text' | 'list' | 'card' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={saving}
                >
                  <option value="text">Text Paragraphs</option>
                  <option value="list">Bullet Point List</option>
                  <option value="card">Status Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center pt-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    disabled={saving}
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    {formData.is_active ? 'Active (visible on page)' : 'Inactive (hidden from page)'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8">
          <Typography variant="h2" weight="semibold" className="text-xl text-gray-900 mb-4">
            Preview
          </Typography>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <Typography variant="h3" weight="semibold" className="text-lg text-gray-900 mb-4">
              {formData.title || 'Section Title'}
            </Typography>
            
            {formData.section_type === 'list' ? (
              <ul className="space-y-2">
                {formData.content.split('\n').filter(item => item.trim()).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                    <Typography variant="body" className="text-gray-700">
                      {item}
                    </Typography>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                {formData.content.split('\n\n').map((paragraph, index) => (
                  <Typography key={index} variant="body" className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </Typography>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentEditForm;
