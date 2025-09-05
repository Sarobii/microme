import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Shield,
  Eye,
  Database,
  Users,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react'

interface TransparencyData {
  card_metadata: {
    generated_at: string
    user_id: string
    version: string
    compliance_frameworks: string[]
  }
  data_sources: {
    primary_data: {
      type: string
      description: string
      retention_policy: string
      purpose: string
    }
    derived_features: {
      type: string
      description: string
      retention_policy: string
      purpose: string
    }
    external_enrichment: {
      type: string
      description: string
      retention_policy: string
      purpose: string
    }
  }
  inference_logic: {
    persona_analysis: {
      plain_english: string
      specific_methods: string[]
      confidence_level: number
      limitations: string
    }
    personality_assessment: {
      plain_english?: string
      specific_methods?: string[]
      confidence_level?: number
      limitations?: string
      status?: string
      reason?: string
    }
    strategy_generation: {
      plain_english: string
      specific_methods: string[]
      confidence_level: number
      limitations: string
    }
  }
  user_controls: {
    privacy_toggles: {
      big_five_personality: {
        current_setting: boolean
        description: string
        impact_if_disabled: string
      }
      external_link_usage: {
        current_setting: boolean
        description: string
        impact_if_disabled: string
      }
      people_tagging_suggestions: {
        current_setting: boolean
        description: string
        impact_if_disabled: string
      }
    }
  }
  human_oversight: {
    required_checkpoints: Array<{
      stage: string
      requirement: string
      reason: string
    }>
    escalation_triggers: string[]
  }
  legal_compliance: {
    gdpr_article_22: {
      title: string
      description: string
      our_position: string
      user_rights: string[]
    }
    ccpa_cpra_rights: {
      description: string
      your_rights: string[]
      contact_info: string
    }
  }
}

export const TransparencyCard: React.FC = () => {
  const { user } = useAuth()
  const [transparencyData, setTransparencyData] = useState<TransparencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [userReviewed, setUserReviewed] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settings, setSettings] = useState({
    big_five_opt_in: true,
    use_external_links: true,
    suggest_tagging: true
  })

  const fetchUserSettings = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('big_five_opt_in, use_external_links, suggest_tagging')
        .eq('id', user?.id)
        .maybeSingle()

      if (data) {
        setSettings({
          big_five_opt_in: data.big_five_opt_in ?? true,
          use_external_links: data.use_external_links ?? true,
          suggest_tagging: data.suggest_tagging ?? true
        })
      }
    } catch (err) {
      console.error('Error fetching user settings:', err)
    }
  }, [user])

  const generateTransparencyCard = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('ethics-guard', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Transparency card generation error:', error)
        setError(`Failed to generate transparency card: ${error.message}`)
      } else {
        await fetchUserSettings() // Refresh data
      }
    } catch (err: any) {
      console.error('Error generating transparency card:', err)
      setError(err.message || 'Failed to generate transparency card')
    }
  }, [fetchUserSettings])

  const fetchTransparencyCard = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('transparency_cards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching transparency card:', error)
        setError('Failed to fetch transparency data')
      } else if (data && data.length > 0) {
        setTransparencyData(data[0].card_data)
        setUserReviewed(data[0].user_reviewed)
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTransparencyCard()
    fetchUserSettings()
  }, [fetchTransparencyCard, fetchUserSettings])

  const updateSettings = useCallback(async (newSettings: Partial<typeof settings>) => {
    setSavingSettings(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(newSettings)
        .eq('id', user?.id)

      if (error) {
        console.error('Error updating settings:', error)
      } else {
        setSettings({ ...settings, ...newSettings })
        // Regenerate transparency card with new settings
        await generateTransparencyCard()
      }
    } catch (err) {
      console.error('Settings update error:', err)
    } finally {
      setSavingSettings(false)
    }
  }, [user, settings, generateTransparencyCard])

  const markAsReviewed = async () => {
    try {
      const { error } = await supabase
        .from('transparency_cards')
        .update({ user_reviewed: true })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error) {
        setUserReviewed(true)
      }
    } catch (err) {
      console.error('Error marking as reviewed:', err)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const downloadData = async () => {
    try {
      // Fetch all user data
      const [posts, persona, strategies, simulations] = await Promise.all([
        supabase.from('linkedin_posts').select('*').eq('user_id', user?.id),
        supabase.from('persona_analysis').select('*').eq('user_id', user?.id),
        supabase.from('content_strategies').select('*').eq('user_id', user?.id),
        supabase.from('simulations').select('*').eq('user_id', user?.id)
      ])

      const userData = {
        posts: posts.data || [],
        persona_analysis: persona.data || [],
        content_strategies: strategies.data || [],
        simulations: simulations.data || [],
        settings: settings,
        exported_at: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `microme-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading data:', err)
    }
  }

  const deleteAllData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return
    }

    try {
      await Promise.all([
        supabase.from('linkedin_posts').delete().eq('user_id', user?.id),
        supabase.from('persona_analysis').delete().eq('user_id', user?.id),
        supabase.from('content_strategies').delete().eq('user_id', user?.id),
        supabase.from('simulations').delete().eq('user_id', user?.id),
        supabase.from('transparency_cards').delete().eq('user_id', user?.id)
      ])
      
      alert('All data has been deleted successfully.')
      window.location.href = '/'
    } catch (err) {
      console.error('Error deleting data:', err)
      alert('Error deleting data. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transparency Card</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!transparencyData) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transparency Card</h1>
          <p className="mt-2 text-gray-600">
            Complete transparency about how your data is used, analyzed, and protected
          </p>
        </div>
        {!userReviewed && (
          <button
            onClick={markAsReviewed}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Reviewed
          </button>
        )}
      </div>

      {/* Card Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Card Information</h2>
          <div className="flex items-center space-x-2">
            {userReviewed && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reviewed
              </span>
            )}
            <span className="text-sm text-gray-500">v{transparencyData.card_metadata.version}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-900">Generated</div>
            <div className="text-sm text-gray-600">
              {new Date(transparencyData.card_metadata.generated_at).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Compliance</div>
            <div className="flex space-x-2">
              {transparencyData.card_metadata.compliance_frameworks.map((framework) => (
                <span key={framework} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {framework}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">User ID</div>
            <div className="text-xs text-gray-600 font-mono">
              {transparencyData.card_metadata.user_id.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Data Sources
          </h2>
          <button
            onClick={() => toggleSection('data-sources')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSection === 'data-sources' ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(transparencyData.data_sources).map(([key, source]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{source.type}</h3>
                <span className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{source.description}</p>
              
              {expandedSection === 'data-sources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-medium text-gray-700">Retention Policy</div>
                    <div className="text-xs text-gray-600">{source.retention_policy}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">Purpose</div>
                    <div className="text-xs text-gray-600">{source.purpose}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inference Logic */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Info className="w-5 h-5 mr-2 text-purple-600" />
            How AI Analysis Works
          </h2>
          <button
            onClick={() => toggleSection('inference')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSection === 'inference' ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="space-y-6">
          {Object.entries(transparencyData.inference_logic).map(([key, logic]) => {
            if ('status' in logic && logic.status === 'disabled') {
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 capitalize mb-2">
                    {key.replace('_', ' ')}
                  </h3>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium">Disabled</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Reason: {logic.reason}
                  </div>
                </div>
              )
            }

            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {key.replace('_', ' ')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (logic.confidence_level || 0) >= 0.8 ? 'bg-green-100 text-green-800' :
                    (logic.confidence_level || 0) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round((logic.confidence_level || 0) * 100)}% Confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{logic.plain_english}</p>
                
                {expandedSection === 'inference' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Specific Methods</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {logic.specific_methods?.map((method: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {method}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Limitations</div>
                      <div className="text-xs text-gray-600">{logic.limitations}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <Settings className="w-5 h-5 mr-2 text-green-600" />
          Privacy Controls
        </h2>
        
        <div className="space-y-4">
          {Object.entries(transparencyData.user_controls.privacy_toggles).map(([key, toggle]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{toggle.description}</h3>
                <button
                  onClick={() => updateSettings({ [key]: !settings[key as keyof typeof settings] })}
                  disabled={savingSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-300'
                  } ${savingSettings ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600">{toggle.impact_if_disabled}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Human Oversight */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-orange-600" />
            Human Oversight
          </h2>
          <button
            onClick={() => toggleSection('oversight')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSection === 'oversight' ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Required Checkpoints</h3>
            <div className="space-y-2">
              {transparencyData.human_oversight.required_checkpoints.map((checkpoint, idx) => (
                <div key={idx} className="border-l-4 border-orange-400 pl-4">
                  <div className="font-medium text-sm">{checkpoint.stage}</div>
                  <div className="text-sm text-gray-600">{checkpoint.requirement}</div>
                  {expandedSection === 'oversight' && (
                    <div className="text-xs text-gray-500 mt-1">{checkpoint.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {expandedSection === 'oversight' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Escalation Triggers</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {transparencyData.human_oversight.escalation_triggers.map((trigger, idx) => (
                  <li key={idx} className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Legal Compliance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Legal Compliance
          </h2>
          <button
            onClick={() => toggleSection('legal')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSection === 'legal' ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">
              {transparencyData.legal_compliance.gdpr_article_22.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {transparencyData.legal_compliance.gdpr_article_22.description}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-sm font-medium text-blue-900 mb-1">Our Position</div>
              <div className="text-sm text-blue-800">
                {transparencyData.legal_compliance.gdpr_article_22.our_position}
              </div>
            </div>
            
            {expandedSection === 'legal' && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Your Rights</div>
                <ul className="space-y-1 text-sm text-gray-600">
                  {transparencyData.legal_compliance.gdpr_article_22.user_rights.map((right, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {right}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">CCPA/CPRA Rights</h3>
            <p className="text-sm text-gray-600 mb-3">
              {transparencyData.legal_compliance.ccpa_cpra_rights.description}
            </p>
            
            {expandedSection === 'legal' && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Your Rights</div>
                <ul className="space-y-1 text-sm text-gray-600 mb-3">
                  {transparencyData.legal_compliance.ccpa_cpra_rights.your_rights.map((right, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {right}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-500">
                  {transparencyData.legal_compliance.ccpa_cpra_rights.contact_info}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={downloadData}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            <div className="text-left">
              <div className="font-medium">Download Your Data</div>
              <div className="text-sm text-gray-500">Export all your data in JSON format</div>
            </div>
          </button>
          
          <button
            onClick={deleteAllData}
            className="flex items-center justify-center px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Delete All Data</div>
              <div className="text-sm text-red-500">Permanently remove all your data</div>
            </div>
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Data Retention:</strong> Your data is automatically deleted 30 days after account deletion. 
              You can request immediate deletion at any time. Some data may be retained longer if required by law.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}