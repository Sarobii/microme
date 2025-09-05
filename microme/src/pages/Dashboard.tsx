import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Upload, 
  User, 
  Target, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react'

interface PipelineStatus {
  posts_count: number
  persona_analysis: boolean
  strategy: boolean
  transparency_card: boolean
  simulation: boolean
  last_updated: string | null
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const fetchPipelineStatus = useCallback(async () => {
    if (!user) return
    try {
      // Check posts count
      const { data: posts } = await supabase
        .from('linkedin_posts')
        .select('id')
        .eq('user_id', user?.id)

      // Check analyses
      const [personaResult, strategyResult, transparencyResult, simulationResult] = await Promise.all([
        supabase
          .from('persona_analysis')
          .select('created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('content_strategies')
          .select('created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('transparency_cards')
          .select('created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('simulations')
          .select('created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      const lastUpdated = [
        personaResult.data?.[0]?.created_at,
        strategyResult.data?.[0]?.created_at,
        transparencyResult.data?.[0]?.created_at,
        simulationResult.data?.[0]?.created_at
      ].filter(Boolean).sort().reverse()[0] || null

      setStatus({
        posts_count: posts?.length || 0,
        persona_analysis: (personaResult.data?.length || 0) > 0,
        strategy: (strategyResult.data?.length || 0) > 0,
        transparency_card: (transparencyResult.data?.length || 0) > 0,
        simulation: (simulationResult.data?.length || 0) > 0,
        last_updated: lastUpdated
      })

      // Set recent activity
      const activities = [
        personaResult.data?.[0] && { type: 'persona', date: personaResult.data[0].created_at },
        strategyResult.data?.[0] && { type: 'strategy', date: strategyResult.data[0].created_at },
        transparencyResult.data?.[0] && { type: 'transparency', date: transparencyResult.data[0].created_at },
        simulationResult.data?.[0] && { type: 'simulation', date: simulationResult.data[0].created_at }
      ].filter(Boolean).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setRecentActivity(activities.slice(0, 3))
    } catch (error) {
      console.error('Error fetching pipeline status:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPipelineStatus()
  }, [fetchPipelineStatus])

  const getStatusIcon = (completed: boolean) => {
    if (completed) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <Clock className="w-5 h-5 text-gray-400" />
  }

  const getNextStep = () => {
    if (!status) return null
    
    if (status.posts_count === 0) return { text: 'Upload your LinkedIn data', link: '/app/upload' }
    if (!status.persona_analysis) return { text: 'Run persona analysis', link: '/app/persona' }
    if (!status.strategy) return { text: 'Generate content strategy', link: '/app/strategy' }
    if (!status.transparency_card) return { text: 'Review transparency card', link: '/app/transparency' }
    if (!status.simulation) return { text: 'Explore simulations', link: '/app/simulation' }
    
    return { text: 'All steps complete! Review your insights', link: '/app/persona' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const nextStep = getNextStep()
  const completionRate = status ? Math.round((
    (status.posts_count > 0 ? 1 : 0) +
    (status.persona_analysis ? 1 : 0) +
    (status.strategy ? 1 : 0) +
    (status.transparency_card ? 1 : 0) +
    (status.simulation ? 1 : 0)
  ) / 5 * 100) : 0

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Track your MicroMe analysis progress and insights.
        </p>
      </div>

      {/* Pipeline Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pipeline Progress</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status?.posts_count > 0)}
            <div>
              <div className="font-medium text-sm">Data Upload</div>
              <div className="text-xs text-gray-500">{status?.posts_count || 0} posts</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(status?.persona_analysis)}
            <div>
              <div className="font-medium text-sm">Persona Analysis</div>
              <div className="text-xs text-gray-500">Topics & tone</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(status?.strategy)}
            <div>
              <div className="font-medium text-sm">Strategy</div>
              <div className="text-xs text-gray-500">Content plan</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(status?.transparency_card)}
            <div>
              <div className="font-medium text-sm">Transparency</div>
              <div className="text-xs text-gray-500">Ethics & privacy</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(status?.simulation)}
            <div>
              <div className="font-medium text-sm">Simulation</div>
              <div className="text-xs text-gray-500">What-if scenarios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Step */}
      {nextStep && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-blue-900">Next Step</div>
                <div className="text-sm text-blue-700">{nextStep.text}</div>
              </div>
            </div>
            <Link
              to={nextStep.link}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/app/upload"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">Upload Data</div>
                  <div className="text-sm text-gray-500">LinkedIn posts</div>
                </div>
              </Link>
              
              <Link
                to="/app/persona"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="font-medium">Persona Insights</div>
                  <div className="text-sm text-gray-500">View analysis</div>
                </div>
              </Link>
              
              <Link
                to="/app/strategy"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Target className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium">Content Strategy</div>
                  <div className="text-sm text-gray-500">Get recommendations</div>
                </div>
              </Link>
              
              <Link
                to="/app/simulation"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium">Simulations</div>
                  <div className="text-sm text-gray-500">Test scenarios</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const activityMap = {
                  persona: { name: 'Persona Analysis', icon: User, color: 'text-green-600' },
                  strategy: { name: 'Content Strategy', icon: Target, color: 'text-purple-600' },
                  transparency: { name: 'Transparency Card', icon: Shield, color: 'text-blue-600' },
                  simulation: { name: 'Simulation Run', icon: TrendingUp, color: 'text-orange-600' }
                }
                const config = activityMap[activity.type as keyof typeof activityMap]
                const Icon = config.icon
                
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{config.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
          
          {status?.last_updated && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Last updated: {new Date(status.last_updated).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transparency Notice */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">Transparency & Ethics</h4>
            <p className="text-sm text-gray-600 mt-1">
              All analysis includes confidence scores and evidence trails. 
              Review your <Link to="/app/transparency" className="text-blue-600 hover:text-blue-500">transparency card</Link> to 
              understand how your data is used and manage privacy settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}