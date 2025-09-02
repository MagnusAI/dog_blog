import { useParams, useNavigate } from 'react-router-dom';
import TitlesEditForm from '../components/TitlesEditForm';
import { decodeDogId, createDogDetailPath } from '../utils/dogUtils';

function TitlesEditPage() {
  const { dogId } = useParams<{ dogId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    if (dogId) {
      // Decode the dog ID to handle encoded special characters like forward slashes
      const decodedDogId = decodeDogId(dogId);
      navigate(createDogDetailPath(decodedDogId));
    } else {
      navigate('/dogs');
    }
  };

  if (!dogId) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Dog ID
            </h2>
            <p className="text-gray-600 mb-6">
              No dog ID provided in the URL.
            </p>
            <button 
              onClick={handleClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Go to Dogs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <TitlesEditForm dogId={dogId} onClose={handleClose} />;
}

export default TitlesEditPage;
