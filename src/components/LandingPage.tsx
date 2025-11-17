import { Building2, Users, FileText, TrendingUp, Award, BookOpen, Shield, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      icon: FileText,
      title: 'Cooperative Registration',
      description: 'Streamlined online registration process for new cooperatives with digital document submission and tracking.',
      color: 'bg-red-600'
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Comprehensive member database with automated updates, share capital tracking, and member communications.',
      color: 'bg-green-700'
    },
    {
      icon: Shield,
      title: 'Compliance Monitoring',
      description: 'Real-time compliance tracking, automated reminders, and digital submission of annual returns and reports.',
      color: 'bg-gray-800'
    },
    {
      icon: TrendingUp,
      title: 'Financial Management',
      description: 'Digital financial reporting, audit management, and transparent tracking of loans, grants, and payments.',
      color: 'bg-red-700'
    },
    {
      icon: BookOpen,
      title: 'Training & Development',
      description: 'Online training programs, certification management, and capacity building for cooperative members and officials.',
      color: 'bg-green-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive statistics, research publications, and data-driven insights for policy makers.',
      color: 'bg-gray-700'
    }
  ];

  const stats = [
    { label: 'Registered Cooperatives', value: '25,000+', icon: Building2 },
    { label: 'Active Members', value: '12M+', icon: Users },
    { label: 'Counties Covered', value: '47', icon: Shield },
    { label: 'Annual Transactions', value: 'KES 800B+', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src="/GOK-logo.svg" alt="Government of Kenya" className="h-16 w-auto" />
              <div className="border-l-2 border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Cooperative Management</h1>
                <p className="text-sm text-gray-600">Information System</p>
              </div>
            </div>
            <button
              onClick={onLogin}
              className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <section className="relative bg-gradient-to-r from-red-600 via-gray-900 to-green-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
              Transforming Cooperative
              <br />
              <span className="text-green-300">Governance in Kenya</span>
            </h2>
            <p className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              A comprehensive digital platform serving the State Department for Cooperatives,
              all 47 counties, and thousands of cooperative societies across Kenya.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Access Portal
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-red-600 transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-red-300 transition-all duration-200 hover:shadow-lg"
              >
                <stat.icon className="h-10 w-10 text-red-600 mb-3" />
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Digital Services
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              17 integrated services designed to streamline cooperative management and enhance transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className={`bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                  activeService === index ? 'border-red-500 scale-105' : 'border-transparent'
                }`}
                onMouseEnter={() => setActiveService(index)}
              >
                <div className={`${service.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h4>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Award className="h-12 w-12 mb-4 text-green-300" />
              <h4 className="text-xl font-bold mb-2">Certified & Secure</h4>
              <p className="text-red-100">
                Government-certified platform with enterprise-grade security and data protection
              </p>
            </div>
            <div>
              <Users className="h-12 w-12 mb-4 text-green-300" />
              <h4 className="text-xl font-bold mb-2">Multi-Tenant Architecture</h4>
              <p className="text-red-100">
                Separate secure environments for national HQ and all 47 counties
              </p>
            </div>
            <div>
              <Shield className="h-12 w-12 mb-4 text-green-300" />
              <h4 className="text-xl font-bold mb-2">Compliance Ready</h4>
              <p className="text-red-100">
                Built-in compliance monitoring and automated regulatory reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of cooperatives already benefiting from our digital platform
          </p>
          <button
            onClick={onLogin}
            className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            Access Your Dashboard
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-white font-bold mb-4">About CMIS</h5>
              <p className="text-sm leading-relaxed">
                The Cooperative Management Information System is an initiative of the State Department
                for Cooperatives to digitize and modernize cooperative governance across Kenya.
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-red-400 transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Training</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Contact</h5>
              <p className="text-sm mb-2">State Department for Cooperatives</p>
              <p className="text-sm mb-2">Nairobi, Kenya</p>
              <p className="text-sm">Email: info@cooperatives.go.ke</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Government of Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
