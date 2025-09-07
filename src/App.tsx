import "./config/imageConfig"; // Initialize image service
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AppBar from "./components/ui/AppBar";
import Button from "./components/ui/Button";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { HomePage, DogsPage, DogFormPage, DogDetailsPage, NewsPage, NewsFormPage, PuppiesPage, ContactPage, ContentManagementPage, ContentEditPage, TitlesEditPage, LoginPage, PedigreeFormPage } from './pages';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navigationLinks = [
    { label: t('navigation.home'), href: "#/" },
    { label: t('navigation.dogs'), href: "#/dogs" },
    { label: t('navigation.news'), href: "#/news" },
    { label: t('navigation.puppies'), href: "#/puppies" },
    { label: t('navigation.contact'), href: "#/contact" }
  ];

  const handleLogoutClick = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const actionItem = (
    <div className="flex items-center space-x-3">
      {user && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
            {t('actions.logout')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar
        links={navigationLinks}
        actionItem={actionItem}
        onLogoClick={() => window.location.hash = "#/"}
      />
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/dogs" element={
            <DogsPage />
        } />
        <Route path="/dogs/new" element={
          <ProtectedRoute>
            <DogFormPage />
          </ProtectedRoute>
        } />
        <Route path="/dogs/edit/:id" element={
          <ProtectedRoute>
            <DogFormPage />
          </ProtectedRoute>
        } />
        <Route path="/dogs/:id" element={
            <DogDetailsPage />
        } />
        <Route path="/dogs/:dogId/pedigree/:lineType" element={
          <ProtectedRoute>
            <PedigreeFormPage />
          </ProtectedRoute>
        } />
        <Route path="/news" element={
            <NewsPage />
        } />
        <Route path="/news/new" element={
          <ProtectedRoute>
            <NewsFormPage />
          </ProtectedRoute>
        } />
        <Route path="/news/edit/:id" element={
          <ProtectedRoute>
            <NewsFormPage />
          </ProtectedRoute>
        } />
        <Route path="/puppies" element={<PuppiesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/content" element={
          <ProtectedRoute>
            <ContentManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/content/edit/:sectionKey" element={
          <ProtectedRoute>
            <ContentEditPage />
          </ProtectedRoute>
        } />
        <Route path="/dogs/:dogId/titles" element={
          <ProtectedRoute>
            <TitlesEditPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
