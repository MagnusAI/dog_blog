import { useParams, useNavigate } from 'react-router-dom';
import ContentEditForm from '../components/ContentEditForm';

function ContentEditPage() {
  const { sectionKey } = useParams<{ sectionKey: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  if (!sectionKey) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Content Section
            </h2>
            <p className="text-gray-600 mb-6">
              No section key provided in the URL.
            </p>
            <button 
              onClick={handleClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ContentEditForm sectionKey={sectionKey} onClose={handleClose} />;
}

export default ContentEditPage;
