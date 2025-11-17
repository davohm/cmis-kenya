import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onBack: () => void;
}

export default function LoginForm({ onBack }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Failed to create account' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Super Admin', email: 'admin@cmis.go.ke', password: 'Admin@2024', color: 'bg-red-600' },
    { role: 'County Admin', email: 'nairobi@cmis.go.ke', password: 'County@2024', color: 'bg-green-700' },
    { role: 'Cooperative', email: 'coop@example.com', password: 'Coop@2024', color: 'bg-gray-700' },
    { role: 'Auditor', email: 'auditor@example.com', password: 'Audit@2024', color: 'bg-red-700' }
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <img src="/GOK-logo.svg" alt="Government of Kenya" className="h-16 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CMIS Portal</h1>
                <p className="text-sm text-gray-600">Cooperative Management System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFullName('');
              }}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
            <div>
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-red-600 font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 via-gray-900 to-green-700 rounded-2xl shadow-2xl p-8 lg:p-12 text-white">
          <div className="h-full flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-4">Demo Accounts</h3>
              <p className="text-gray-100 mb-8 leading-relaxed">
                Try the system with pre-configured demo accounts. Click any account below to auto-fill the login form.
              </p>

              <div className="space-y-4">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => fillDemoAccount(account.email, account.password)}
                    className="w-full text-left bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 p-4 rounded-lg transition-all duration-200 border border-white border-opacity-20 hover:border-opacity-40 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg mb-1 group-hover:text-green-300 transition-colors">
                          {account.role}
                        </p>
                        <p className="text-sm text-gray-200">{account.email}</p>
                        <p className="text-xs text-gray-300 mt-1">Password: {account.password}</p>
                      </div>
                      <div className={`${account.color} w-3 h-3 rounded-full flex-shrink-0 mt-1`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white border-opacity-20">
              <p className="text-sm text-gray-200">
                <strong>Note:</strong> These are demo accounts with sample data for evaluation purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
