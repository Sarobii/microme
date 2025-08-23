import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  User,
  BarChart3,
  Clock,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Info
} from 'lucide-react'

interface PersonaData {
  topics: {
    primary_clusters: Array<{
      theme: string
      keywords: Array<{ word: string; frequency: number }>
      post_count: number
    }>
    evidence: string[]
  }
  tone: {
    overall: string
    sentiment_score: number
    humor_markers: number
    evidence: string[]
  }
  cadence: {
    days_active: number
    peak_posting_hour: number
    posts_per_week: number
    time_of_day_heatmap: Array<{ hour: number; posts: number }>
    evidence: string[]
  }
  engagement: {
    average_likes: number
    average_comments: number
    average_shares: number
    media_vs_text_performance: {
      media_posts: number
      text_posts: number
      delta: number
    }
    evidence: string[]
  }
  big_five_personality?: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    confidence_interval: string
    limitation_note: string
    evidence: string[]
  }
  current_persona_signals: {
    authority_indicators: string[]
    authenticity_markers: string[]
    audience_connection: string[]
    evidence_snippets: Array<{
      post_id: string
      excerpt: string
      analysis: string
    }>
  }
  analysis_metadata: {
    posts_analyzed: number
    analysis_date: string
    confidence_score: number
    data_quality: string
  }
}

export const PersonaAnalysis: React.FC = () => {
  const { user } = useAuth()
  const [personaData, setPersonaData] = useState<PersonaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [showPersonality, setShowPersonality] = useState(true)
  const [expandedEvidenceSection, setExpandedEvidenceSection] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPersonaAnalysis()
    }
  }, [user])

  const fetchPersonaAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('persona_analysis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching persona analysis:', error)
        setError('Failed to fetch analysis data')
      } else if (data && data.length > 0) {
        setPersonaData(data[0].analysis_data)
      } else {
        setError('No persona analysis found. Please upload data and run analysis first.')
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError('')
    
    try {
      const { data, error } = await supabase.functions.invoke('persona-analyst', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Analysis error:', error)
        setError(`Analysis failed: ${error.message}`)
      } else {
        console.log('Analysis result:', data)
        await fetchPersonaAnalysis() // Refresh data
      }
    } catch (err: any) {
      console.error('Error running analysis:', err)
      setError(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const toggleEvidenceSection = (section: string) => {
    setExpandedEvidenceSection(
      expandedEvidenceSection === section ? null : section
    )
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

  if (error && !personaData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {analyzing ? 'Analyzing...' : 'Run Persona Analysis'}
          </button>
        </div>
      </div>
    )
  }

  if (!personaData) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Persona Analysis</h1>
          <p className="mt-2 text-gray-600">
            Evidence-based insights into your content patterns and personality signals
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {analyzing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Analysis Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{personaData.analysis_metadata.posts_analyzed}</div>
            <div className="text-sm text-gray-500">Posts Analyzed</div>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
              getConfidenceColor(personaData.analysis_metadata.confidence_score)
            }`}>
              {Math.round(personaData.analysis_metadata.confidence_score * 100)}% Confidence
            </div>
            <div className="text-sm text-gray-500 mt-1">Analysis Quality</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {personaData.analysis_metadata.data_quality}
            </div>
            <div className="text-sm text-gray-500">Data Quality</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-900">
              {new Date(personaData.analysis_metadata.analysis_date).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">Last Updated</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Topics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Content Topics
            </h2>
            <button
              onClick={() => toggleEvidenceSection('topics')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedEvidenceSection === 'topics' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            {personaData.topics.primary_clusters.map((cluster, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{cluster.theme}</h3>
                  <span className="text-sm text-gray-500">{cluster.post_count} posts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.keywords.slice(0, 6).map((keyword, kidx) => (
                    <span
                      key={kidx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword.word} ({keyword.frequency})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {expandedEvidenceSection === 'topics' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Evidence
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {personaData.topics.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tone Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
              Tone & Sentiment
            </h2>
            <button
              onClick={() => toggleEvidenceSection('tone')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedEvidenceSection === 'tone' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Tone</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                personaData.tone.overall === 'light' ? 'bg-green-100 text-green-800' :
                personaData.tone.overall === 'serious' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {personaData.tone.overall}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sentiment Score</span>
              <span className="font-medium">{personaData.tone.sentiment_score}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Humor Markers</span>
              <span className="font-medium">{personaData.tone.humor_markers}</span>
            </div>
          </div>
          
          {expandedEvidenceSection === 'tone' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Evidence
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {personaData.tone.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Posting Cadence */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              Posting Cadence
            </h2>
            <button
              onClick={() => toggleEvidenceSection('cadence')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedEvidenceSection === 'cadence' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Days</span>
              <span className="font-medium">{personaData.cadence.days_active}/7 days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Peak Hour</span>
              <span className="font-medium">{personaData.cadence.peak_posting_hour}:00</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Posts per Week</span>
              <span className="font-medium">{personaData.cadence.posts_per_week}</span>
            </div>
          </div>
          
          {expandedEvidenceSection === 'cadence' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Evidence
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {personaData.cadence.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Engagement Patterns */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              Engagement Patterns
            </h2>
            <button
              onClick={() => toggleEvidenceSection('engagement')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedEvidenceSection === 'engagement' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(personaData.engagement.average_likes * 10) / 10}
                </div>
                <div className="text-sm text-gray-500">Avg Likes</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(personaData.engagement.average_comments * 10) / 10}
                </div>
                <div className="text-sm text-gray-500">Avg Comments</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(personaData.engagement.average_shares * 10) / 10}
                </div>
                <div className="text-sm text-gray-500">Avg Shares</div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 mb-2">Media vs Text Performance</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Media Posts</span>
                <span className="text-sm font-medium">{personaData.engagement.media_vs_text_performance.media_posts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Text Posts</span>
                <span className="text-sm font-medium">{personaData.engagement.media_vs_text_performance.text_posts}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-sm text-gray-900">Delta</span>
                <span className={`text-sm ${
                  personaData.engagement.media_vs_text_performance.delta > 0 
                    ? 'text-green-600' 
                    : personaData.engagement.media_vs_text_performance.delta < 0 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  {personaData.engagement.media_vs_text_performance.delta > 0 ? '+' : ''}
                  {personaData.engagement.media_vs_text_performance.delta}
                </span>
              </div>
            </div>
          </div>
          
          {expandedEvidenceSection === 'engagement' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Evidence
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {personaData.engagement.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Big Five Personality (if opted in) */}
      {personaData.big_five_personality && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              Big Five Personality Analysis
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPersonality(!showPersonality)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPersonality ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => toggleEvidenceSection('personality')}
                className="text-gray-400 hover:text-gray-600"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {showPersonality && (
            <div className="space-y-4">
              {Object.entries(personaData.big_five_personality).filter(([key]) => 
                !['confidence_interval', 'limitation_note', 'evidence'].includes(key)
              ).map(([trait, score]) => (
                <div key={trait} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {trait.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{score as number}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${score as number}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Confidence Interval:</strong> {personaData.big_five_personality.confidence_interval}
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Limitation:</strong> {personaData.big_five_personality.limitation_note}
                </p>
              </div>
            </div>
          )}
          
          {expandedEvidenceSection === 'personality' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Evidence
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {personaData.big_five_personality.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Current Persona Signals */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Persona Signals</h2>
          <button
            onClick={() => toggleEvidenceSection('signals')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedEvidenceSection === 'signals' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Authority Indicators</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {personaData.current_persona_signals.authority_indicators.map((indicator, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Authenticity Markers</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {personaData.current_persona_signals.authenticity_markers.map((marker, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  {marker}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Audience Connection</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {personaData.current_persona_signals.audience_connection.map((connection, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  {connection}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {expandedEvidenceSection === 'signals' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Evidence Snippets
            </h4>
            <div className="space-y-3">
              {personaData.current_persona_signals.evidence_snippets.map((snippet, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">"{snippet.excerpt}"</p>
                  <p className="text-xs text-blue-600 font-medium">{snippet.analysis}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Human Review Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Human Review Required</h4>
            <p className="text-sm text-amber-800 mt-1">
              This AI analysis provides insights based on your content patterns. 
              For important decisions about your professional brand or strategy, 
              please validate these insights with your own judgment and consider consulting with marketing professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}