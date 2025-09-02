import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { contentService } from '../services/supabaseService';
import type { ContentSection } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

function PuppiesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation('pages');
    const [contentSections, setContentSections] = useState<ContentSection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPuppiesContent();
    }, []);

    const loadPuppiesContent = async () => {
        try {
            const content = await contentService.getPageContent('puppies');
            setContentSections(content);
        } catch (error) {
            console.error('Error loading puppies content:', error);
        } finally {
            setLoading(false);
        }
    };

    const getContentByKey = (key: string) => {
        return contentSections.find(section => section.section_key === key);
    };

    const renderListContent = (content: string) => {
        const items = content.split('\n').filter(item => item.trim());
        return (
            <ul className="space-y-4 pl-4">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                        <Typography variant="body" className="text-gray-700">
                            {item}
                        </Typography>
                    </li>
                ))}
            </ul>
        );
    };

    const renderTextContent = (content: string) => {
        return content.split('\n\n').map((paragraph, index) => (
            <Typography key={index} variant="body" className="text-lg text-gray-600 leading-relaxed mb-6">
                {paragraph}
            </Typography>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-6xl mx-auto px-8 py-16">
                    <div className="text-center py-12">
                        <Typography variant="body" color="secondary">Loading...</Typography>
                    </div>
                </div>
            </div>
        );
    }

    const statusContent = getContentByKey('puppy_status');
    const introContent = getContentByKey('puppy_intro');
    const includesContent = getContentByKey('puppy_includes');
    const contactTextContent = getContentByKey('puppy_contact_text');

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-8 py-16">
                {/* Current Status Card */}
                {statusContent && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-12 relative">
                        {user && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/content/edit/${statusContent.section_key}`)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 border-gray-300"
                            >
                                ✏️ {t('actions.editContent', 'common')}
                            </Button>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <Typography variant="h3" weight="semibold" className="text-gray-900 mb-1">
                                    {statusContent.title}
                                </Typography>
                                <Typography variant="body" color="secondary">
                                    {statusContent.content}
                                </Typography>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {introContent && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <Typography variant="h1" weight="bold" className="text-4xl md:text-5xl text-gray-900">
                                {introContent.title}
                            </Typography>
                            {user && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/content/edit/${introContent.section_key}`)}
                                    className="text-gray-500 hover:text-gray-700 border-gray-300"
                                >
                                    ✏️ {t('actions.editContent', 'common')}
                                </Button>
                            )}
                        </div>
                        <div className="space-y-8 mb-16">
                            {renderTextContent(introContent.content)}
                        </div>
                    </>
                )}

                {/* What Comes With Puppies */}
                {includesContent && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <Typography variant="h2" weight="bold" className="text-2xl md:text-3xl text-gray-900">
                                {includesContent.title}
                            </Typography>
                            {user && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/content/edit/${includesContent.section_key}`)}
                                    className="text-gray-500 hover:text-gray-700 border-gray-300"
                                >
                                    ✏️ {t('actions.editContent', 'common')}
                                </Button>
                            )}
                        </div>
                        {renderListContent(includesContent.content)}
                    </div>
                )}

                {/* Interest Contact */}
                {contactTextContent && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <Typography variant="h2" weight="bold" className="text-2xl md:text-3xl text-gray-900">
                                {contactTextContent.title}
                            </Typography>
                            {user && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/content/edit/${contactTextContent.section_key}`)}
                                    className="text-gray-500 hover:text-gray-700 border-gray-300"
                                >
                                    ✏️ {t('actions.editContent', 'common')}
                                </Button>
                            )}
                        </div>
                        <div className="space-y-8 mb-8">
                            {renderTextContent(contactTextContent.content)}
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                            <Typography variant="body" className="text-lg text-gray-700">
                                {t('common.email', 'common')}:
                            </Typography>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = 'mailto:tinearnild@hotmail.com'}
                                className="text-gray-900 border-gray-300 hover:bg-gray-100 px-6 py-3"
                            >
                                tinearnild@hotmail.com
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default PuppiesPage;
