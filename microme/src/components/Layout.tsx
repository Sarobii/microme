import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart3,
  Upload,
  User,
  Target,
  Shield,
  TrendingUp,
  Settings,
  LogOut,
  Home,
  Info
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home },
  { name: 'Upload Data', href: '/app/upload', icon: Upload },
  { name: 'Persona Analysis', href: '/app/persona', icon: User },
  { name: 'Content Strategy', href: '/app/strategy', icon: Target },
  { name: 'Transparency', href: '/app/transparency', icon: Shield },
  { name: 'Simulation', href: '/app/simulation', icon: TrendingUp },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">MicroMe</h1>
          <BarChart3 className="w-6 h-6 ml-2 text-blue-200" />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* User info and sign out */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.email || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign out
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
        
        {/* Footer with transparency info */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Info className="w-3 h-3 mr-1" />
              <span>All analysis includes confidence scores and evidence trails</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/app/transparency" className="hover:text-gray-700">
                Privacy & Ethics
              </Link>
              <span>Human oversight required for content decisions</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}