import { useState, useEffect } from 'react';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { contentService } from '../services/supabaseService';
import type { ContentSection, ContentSectionUpdateData } from '../services/supabaseService';

interface ContentManagerProps {
  onClose?: () => void;
}

function ContentManager({ onClose }: ContentManagerProps) {
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    section_type: 'text' as 'text' | 'list' | 'card',
    sort_order: 0,
    is_active: true
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentService.getAllContent();
      setContentSections(data);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content sections');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: ContentSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      content: section.content,
      section_type: section.section_type,
      sort_order: section.sort_order,
      is_active: section.is_active
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!editingSection) return;

    try {
      setError(null);
      const updateData: ContentSectionUpdateData = {
        title: formData.title,
        content: formData.content,
        section_type: formData.section_type,
        sort_order: formData.sort_order,
        is_active: formData.is_active
      };

      await contentService.updateContentSection(editingSection.id, updateData);
      setSuccess('Content section updated successfully');
      setEditingSection(null);
      await loadContent();
    } catch (err) {
      console.error('Error updating content:', err);
      setError('Failed to update content section');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setError(null);
    setSuccess(null);
  };

  const handleToggleActive = async (section: ContentSection) => {
    try {
      await contentService.toggleContentActive(section.id);
      setSuccess(`Content section ${section.is_active ? 'deactivated' : 'activated'}`);
      await loadContent();
    } catch (err) {
      console.error('Error toggling content status:', err);
      setError('Failed to toggle content status');
    }
  };

  const renderContentPreview = (content: string, type: 'text' | 'list' | 'card') => {
    if (type === 'list') {
      const items = content.split('\n').filter(item => item.trim());
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          {items.slice(0, 3).map((item, index) => (
            <li key={index}>{item.length > 80 ? `${item.substring(0, 80)}...` : item}</li>
          ))}
          {items.length > 3 && <li>... and {items.length - 3} more items</li>}
        </ul>
      );
    }
    
    const preview = content.length > 150 ? `${content.substring(0, 150)}...` : content;
    return <p className="text-sm text-gray-600">{preview}</p>;
  };

  const groupedContent = contentSections.reduce((acc, section) => {
    if (!acc[section.page]) {
      acc[section.page] = [];
    }
    acc[section.page].push(section);
    return acc;
  }, {} as Record<string, ContentSection[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Typography variant="body" color="secondary">Loading content sections...</Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Typography variant="h1" weight="bold" className="text-3xl md:text-4xl text-gray-900">
            Content Management
          </Typography>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ← Back
            </Button>
          )}
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
        {editingSection && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <Typography variant="h2" weight="semibold" className="text-xl text-gray-900 mb-4">
              Editing: {editingSection.section_key}
            </Typography>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={formData.section_type === 'list' ? 8 : 6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder={formData.section_type === 'list' ? "Each line will be a separate list item" : "Enter content here..."}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.section_type}
                    onChange={(e) => setFormData({ ...formData, section_type: e.target.value as 'text' | 'list' | 'card' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="text">Text</option>
                    <option value="list">List</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Sections by Page */}
        <div className="space-y-8">
          {Object.entries(groupedContent).map(([page, sections]) => (
            <div key={page} className="border border-gray-200 rounded-xl p-6">
              <Typography variant="h2" weight="semibold" className="text-xl text-gray-900 mb-4 capitalize">
                {page} Page Content
              </Typography>
              
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`border border-gray-200 rounded-lg p-4 ${!section.is_active ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Typography variant="h3" weight="semibold" className="text-lg text-gray-900">
                            {section.title}
                          </Typography>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {section.section_type}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Order: {section.sort_order}
                          </span>
                          {!section.is_active && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <Typography variant="caption" color="secondary" className="block mb-2">
                          Key: {section.section_key}
                        </Typography>
                        {renderContentPreview(section.content, section.section_type)}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(section)}
                          disabled={editingSection?.id === section.id}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(section)}
                          className={section.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {section.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContentManager;
