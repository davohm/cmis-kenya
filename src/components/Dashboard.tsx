import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Building2, FileText, Users, TrendingUp, Award, BookOpen, BarChart3, Search, Bell, Menu, MessageSquareWarning, Shield, GraduationCap, SearchCheck, Network, MapPin, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import CountyAdminDashboard from './dashboards/CountyAdminDashboard';
import CooperativeDashboard from './dashboards/CooperativeDashboard';
import AuditorDashboard from './dashboards/AuditorDashboard';
import TrainerDashboard from './dashboards/TrainerDashboard';
import CitizenDashboard from './dashboards/CitizenDashboard';
import GlobalSearchModal from './search/GlobalSearchModal';
import { SearchResult } from '../hooks/useGlobalSearch';

export default function Dashboard() {
  const { profile, signOut, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'cooperative':
        setActiveTab('cooperatives');
        break;
      case 'application':
        setActiveTab('applications');
        break;
      case 'user':
        setActiveTab('overview');
        break;
      case 'complaint':
        setActiveTab('complaints');
        break;
      case 'amendment':
        setActiveTab('amendments');
        break;
      case 'auditor':
        setActiveTab('auditors');
        break;
      case 'trainer':
        setActiveTab('trainers');
        break;
      case 'official_search':
        setActiveTab('searches');
        break;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">
              Your user profile could not be loaded. This may be due to:
            </p>
            <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
              <li>• Database permissions (RLS policies)</li>
              <li>• Missing user data in the database</li>
              <li>• Network connectivity issues</li>
            </ul>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out and Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = useMemo(() => hasRole('SUPER_ADMIN'), [hasRole]);
  
  const navigationItems = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Home },
    ...(isSuperAdmin ? [{ id: 'cooperatives_management', label: 'Cooperatives Management', icon: Building2 }] : []),
    { 
      id: 'cooperatives', 
      label: 'Cooperatives', 
      icon: Building2,
      children: []
    },
    ...(isSuperAdmin ? [{ id: 'counties', label: 'County Management', icon: MapPin }] : []),
    ...(isSuperAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    ...(isSuperAdmin ? [{ id: 'documents', label: 'Document Management', icon: FileText }] : []),
    ...(isSuperAdmin ? [{ id: 'system-health', label: 'System Health', icon: Activity }] : []),
    ...(isSuperAdmin ? [{ id: 'audit-logs', label: 'Audit Logs', icon: FileText }] : []),
    ...(isSuperAdmin ? [{ id: 'member-management', label: 'Member Management', icon: Users }] : []),
    ...(isSuperAdmin ? [{ id: 'system-settings', label: 'System Settings', icon: Settings }] : []),
    ...(isSuperAdmin ? [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }] : []),
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'searches', label: 'Official Searches', icon: SearchCheck },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'compliance', label: 'Compliance', icon: Award },
    { id: 'auditors', label: 'Auditors', icon: Shield },
    { id: 'trainers', label: 'Trainers', icon: GraduationCap },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
    ...(isSuperAdmin ? [{ id: 'integrations', label: 'Integrations', icon: Network }] : []),
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ], [isSuperAdmin]);

  // Auto-expand parent if child is active
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some((child: any) => child.id === activeTab);
        if (hasActiveChild && !expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id]);
        }
      }
    });
  }, [activeTab, navigationItems]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getDashboardComponent = () => {
    if (hasRole('SUPER_ADMIN')) return <SuperAdminDashboard activeTab={activeTab} />;
    if (hasRole('COUNTY_ADMIN') || hasRole('COUNTY_OFFICER')) return <CountyAdminDashboard activeTab={activeTab} />;
    if (hasRole('COOPERATIVE_ADMIN')) return <CooperativeDashboard activeTab={activeTab} />;
    if (hasRole('AUDITOR')) return <AuditorDashboard activeTab={activeTab} />;
    if (hasRole('TRAINER')) return <TrainerDashboard activeTab={activeTab} />;
    return <CitizenDashboard activeTab={activeTab} />;
  };

  const getRoleBadgeColor = () => {
    if (hasRole('SUPER_ADMIN')) return 'bg-red-600';
    if (hasRole('COUNTY_ADMIN')) return 'bg-green-700';
    if (hasRole('AUDITOR')) return 'bg-gray-700';
    if (hasRole('TRAINER')) return 'bg-green-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <img src="/GOK-logo.svg" alt="GOK" className="h-12 w-auto" />
              <div className="border-l-2 border-gray-300 pl-4">
                <h1 className="text-lg font-bold text-gray-900">CMIS Dashboard</h1>
                <p className="text-xs text-gray-600">Cooperative Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="hidden md:flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                title="Search (⌘K or Ctrl+K)"
              >
                <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700">Search...</span>
                <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5 text-gray-600" />
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 border-l border-gray-300 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-600">{profile.roles[0]?.tenant_name || 'CMIS User'}</p>
                </div>
                <div className={`${getRoleBadgeColor()} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`}>
                  {profile.full_name.charAt(0)}
                </div>
                <button
                  onClick={signOut}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <div className="p-4">
            <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-green-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">YOUR ROLE</p>
              <div className="flex items-center space-x-2">
                <span className={`${getRoleBadgeColor()} w-2 h-2 rounded-full`}></span>
                <p className="font-bold text-gray-900">{profile.roles[0]?.role.replace('_', ' ') || 'User'}</p>
              </div>
              {profile.roles[0]?.tenant_name && (
                <p className="text-xs text-gray-600 mt-1">{profile.roles[0].tenant_name}</p>
              )}
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.id);
                const isActive = activeTab === item.id;
                const hasActiveChild = item.children?.some((child: any) => child.id === activeTab);
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleExpanded(item.id);
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive || hasActiveChild
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {hasChildren && (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )
                      )}
                    </button>
                    
                    {hasChildren && isExpanded && (
                      <div className="mt-1 space-y-1">
                        {item.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => setActiveTab(child.id)}
                            className={`w-full flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              activeTab === child.id
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <child.icon className="h-4 w-4" />
                            <span className="font-medium">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {getDashboardComponent()}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onResultSelect={handleSearchResultSelect}
      />
    </div>
  );
}
