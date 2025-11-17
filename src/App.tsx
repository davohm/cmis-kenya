import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function AppContent() {
  const [showLogin, setShowLogin] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading CMIS...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  if (showLogin) {
    return <LoginForm onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onLogin={() => setShowLogin(true)} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
