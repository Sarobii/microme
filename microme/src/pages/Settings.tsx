import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Save,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'

interface UserSettings {
  full_name: string
  email: string
  big_five_opt_in: boolean
  use_external_links: boolean
  suggest_tagging: boolean
}

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    full_name: '',
    email: '',
    big_five_opt_in: true,
    use_external_links: true,
    suggest_tagging: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [stats, setStats] = useState({
    posts_count: 0,
    analyses_count: 0,
    strategies_count: 0,
    simulations_count: 0,
    data_size: 0
  })

  const fetchSettings = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } else if (data) {
        setSettings({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          big_five_opt_in: data.big_five_opt_in ?? true,
          use_external_links: data.use_external_links ?? true,
          suggest_tagging: data.suggest_tagging ?? true
        })
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            email: user?.email,
            big_five_opt_in: true,
            use_external_links: true,
            suggest_tagging: true
          })
        
        if (!insertError) {
          setSettings(prev => ({ ...prev, email: user?.email || '' }))
        }
      }
    } catch (err) {
      console.error('Settings fetch error:', err)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchStats = useCallback(async () => {
    if (!user) return
    try {
      const [postsResult, personaResult, strategyResult, simulationResult] = await Promise.all([
        supabase.from('linkedin_posts').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('persona_analysis').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('content_strategies').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('simulations').select('id', { count: 'exact' }).eq('user_id', user?.id)
      ])

      setStats({
        posts_count: postsResult.count || 0,
        analyses_count: personaResult.count || 0,
        strategies_count: strategyResult.count || 0,
        simulations_count: simulationResult.count || 0,
        data_size: Math.round(((postsResult.count || 0) * 2 + (personaResult.count || 0) * 5 + 
                             (strategyResult.count || 0) * 3 + (simulationResult.count || 0) * 4) * 1024 / 1024 * 100) / 100
      })
    } catch (err) {
      console.error('Stats fetch error:', err)
    }
  }, [user])

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [fetchSettings, fetchStats])

  const saveSettings = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: settings.full_name,
          email: settings.email,
          big_five_opt_in: settings.big_five_opt_in,
          use_external_links: settings.use_external_links,
          suggest_tagging: settings.suggest_tagging,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Save error:', error)
        setMessage({ type: 'error', text: 'Failed to save settings' })
      } else {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (err: any) {
      console.error('Settings save error:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const downloadData = async () => {
    try {
      const [posts, persona, strategies, simulations, transparency] = await Promise.all([
        supabase.from('linkedin_posts').select('*').eq('user_id', user?.id),
        supabase.from('persona_analysis').select('*').eq('user_id', user?.id),
        supabase.from('content_strategies').select('*').eq('user_id', user?.id),
        supabase.from('simulations').select('*').eq('user_id', user?.id),
        supabase.from('transparency_cards').select('*').eq('user_id', user?.id)
      ])

      const userData = {
        user_id: user?.id,
        email: user?.email,
        export_date: new Date().toISOString(),
        settings: settings,
        data: {
          posts: posts.data || [],
          persona_analysis: persona.data || [],
          content_strategies: strategies.data || [],
          simulations: simulations.data || [],
          transparency_cards: transparency.data || []
        },
        summary: stats
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `microme-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Data exported successfully' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      console.error('Export error:', err)
      setMessage({ type: 'error', text: 'Failed to export data' })
    }
  }

  const deleteAllData = async () => {
    const confirmation = prompt(
      'This will permanently delete ALL your data including posts, analyses, strategies, and simulations. '
      + 'Type "DELETE MY DATA" to confirm:'
    )
    
    if (confirmation !== 'DELETE MY DATA') {
      return
    }

    try {
      await Promise.all([
        supabase.from('linkedin_posts').delete().eq('user_id', user?.id),
        supabase.from('persona_analysis').delete().eq('user_id', user?.id),
        supabase.from('content_strategies').delete().eq('user_id', user?.id),
        supabase.from('simulations').delete().eq('user_id', user?.id),
        supabase.from('transparency_cards').delete().eq('user_id', user?.id),
        supabase.from('data_ingestions').delete().eq('user_id', user?.id)
      ])
      
      setMessage({ type: 'success', text: 'All data deleted successfully' })
      fetchStats() // Refresh stats
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      console.error('Delete error:', err)
      setMessage({ type: 'error', text: 'Failed to delete data' })
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchSettings(), fetchStats()])
    setMessage({ type: 'success', text: 'Data refreshed' })
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and privacy settings
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Account Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={settings.full_name}
              onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              placeholder="your@email.com"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Email changes require account re-verification</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-green-600" />
          Privacy & AI Analysis Settings
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => setSettings({ ...settings, big_five_opt_in: !settings.big_five_opt_in })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.big_five_opt_in ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.big_five_opt_in ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Big Five Personality Analysis</div>
              <div className="text-sm text-gray-600">
                Enable AI analysis of personality traits based on your content patterns. 
                This provides insights into openness, conscientiousness, extraversion, agreeableness, and neuroticism.
              </div>
              <div className="text-xs text-gray-500 mt-1">
                When disabled: Strategy recommendations focus on content patterns without personality insights
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <button
              onClick={() => setSettings({ ...settings, use_external_links: !settings.use_external_links })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.use_external_links ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.use_external_links ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex-1">
              <div className="font-medium text-gray-900">External Link Suggestions</div>
              <div className="text-sm text-gray-600">
                Allow content recommendations to include external links and resource references.
              </div>
              <div className="text-xs text-gray-500 mt-1">
                When disabled: Content suggestions focus on original content without external references
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <button
              onClick={() => setSettings({ ...settings, suggest_tagging: !settings.suggest_tagging })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.suggest_tagging ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.suggest_tagging ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex-1">
              <div className="font-medium text-gray-900">People & Brand Tagging Suggestions</div>
              <div className="text-sm text-gray-600">
                Include suggestions for tagging relevant people, brands, or organizations in your content.
              </div>
              <div className="text-xs text-gray-500 mt-1">
                When disabled: Strategy excludes collaboration and networking recommendations
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-purple-600" />
          Data Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.posts_count}</div>
            <div className="text-sm text-gray-600">LinkedIn Posts</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.analyses_count}</div>
            <div className="text-sm text-gray-600">Persona Analyses</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.strategies_count}</div>
            <div className="text-sm text-gray-600">Content Strategies</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.simulations_count}</div>
            <div className="text-sm text-gray-600">Simulations</div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          Estimated data size: ~{stats.data_size} MB
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={downloadData}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </button>
          
          <button
            onClick={deleteAllData}
            className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Data
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-gray-600" />
          Account Actions
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={signOut}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Data Retention Policy</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Your data is retained while your account is active</p>
            <p>• Data is automatically deleted 30 days after account deletion</p>
            <p>• You can request immediate deletion using the "Delete All Data" button above</p>
            <p>• Some data may be retained longer if required by law</p>
          </div>
        </div>
      </div>
    </div>
  )
}