import "./config/imageConfig"; // Initialize image service
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AppBar from "./components/ui/AppBar";
import Button from "./components/ui/Button";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage, DogsPage, DogDetailsPage, NewsPage, LoginPage } from './pages';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navigationLinks = [
    { label: "Home", href: "#/" },
    { label: "Dogs", href: "#/dogs" },
    { label: "Archive", href: "#/archive" },
    { label: "About", href: "#/about" }
  ];

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const actionItem = user ? (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {user.email}
      </span>
      <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
        Logout
      </Button>
    </div>
  ) : (
    <Button variant="primary" size="sm" onClick={handleLoginClick}>
      Login
    </Button>
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
        <Route path="/dogs/:id" element={
            <DogDetailsPage />
        } />
        <Route path="/archive" element={
            <NewsPage />
        } />
        <Route path="/about" element={
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">About Our Kennel</h1>
            <p className="text-gray-600">Coming soon...</p>
          </div>
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
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
