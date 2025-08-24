import "./config/imageConfig"; // Initialize image service
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppBar from "./components/ui/AppBar";
import Button from "./components/ui/Button";
import { HomePage, DogsPage, DogDetailsPage, ArchivePage } from './pages';

function App() {
  const navigationLinks = [
    { label: "Home", href: "#/" },
    { label: "Dogs", href: "#/dogs" },
    { label: "Archive", href: "#/archive" },
    { label: "About", href: "#/about" }
  ];

  const loginButton = (
    <Button variant="primary" size="sm">
      Login
    </Button>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppBar
          links={navigationLinks}
          actionItem={loginButton}
          onLogoClick={() => window.location.hash = "#/"}
        />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dogs" element={<DogsPage />} />
          <Route path="/dogs/:id" element={<DogDetailsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
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
    </Router>
  );
}

export default App;
