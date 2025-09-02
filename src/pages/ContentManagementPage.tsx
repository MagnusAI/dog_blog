import { useNavigate } from 'react-router-dom';
import ContentManager from '../components/ContentManager';

function ContentManagementPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return <ContentManager onClose={handleClose} />;
}

export default ContentManagementPage;
