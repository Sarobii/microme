import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  TrendingUp,
  Play,
  AlertTriangle,
  BarChart3,
  Target,
  Users,
  MessageCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react'

interface SimulationData {
  scenario: string
  scenario_analysis: {
    frequency: string
    contentType: string
    platform: string
    currentFrequency: number
  }
  expected_effects: {
    authority: {
      direction: string
      magnitude: string
      explanation: string
      confidence: number
      timeline: string
    }
    warmth: {
      direction: string
      magnitude: string
      explanation: string
      confidence: number
      timeline: string
    }
    reach: {
      direction: string
      magnitude: string
      explanation: string
      confidence: number
      timeline: string
    }
    replies: {
      direction: string
      magnitude: string
      explanation: string
      confidence: number
      timeline: string
    }
  }
  assumptions: {
    audience_assumptions: string[]
    content_assumptions: string[]
    platform_assumptions: string[]
    external_assumptions: string[]
  }
  risks: {
    engagement_risks: Array<{
      risk: string
      probability: string
      impact: string
      mitigation: string
    }>
    resource_risks: Array<{
      risk: string
      probability: string
      impact: string
      mitigation: string
    }>
    strategic_risks: Array<{
      risk: string
      probability: string
      impact: string
      mitigation: string
    }>
  }
  ab_test_plan: {
    hypothesis: string
    test_design: {
      control_group: string
      treatment_group: string
      duration: string
      sample_size_justification: string
    }
    primary_metrics: Array<{
      metric: string
      measurement: string
      target: string
    }>
    secondary_metrics: Array<{
      metric: string
      measurement: string
      target: string
    }>
    analysis_plan: {
      weekly_checkpoints: string
      mid_point_analysis: string
      final_analysis: string
      decision_criteria: string
    }
  }
  disclaimer: {
    important_notice: string
    explanation: string
    recommended_action: string
  }
}

export const Simulation: React.FC = () => {
  const { user } = useAuth()
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [scenario, setScenario] = useState('What if I post 2 case studies per week?')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [simulations, setSimulations] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchSimulations()
    }
  }, [user])

  const fetchSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching simulations:', error)
        setError('Failed to fetch simulation data')
      } else if (data && data.length > 0) {
        setSimulations(data)
        setSimulationData(data[0].simulation_data)
      } else {
        setError('No simulations found. Run your first simulation below.')
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = async () => {
    setRunning(true)
    setError('')
    
    try {
      const { data, error } = await supabase.functions.invoke('simulation-agent', {
        body: { scenario },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Simulation error:', error)
        setError(`Simulation failed: ${error.message}`)
      } else {
        console.log('Simulation result:', data)
        await fetchSimulations() // Refresh data
      }
    } catch (err: any) {
      console.error('Error running simulation:', err)
      setError(err.message || 'Simulation failed')
    } finally {
      setRunning(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getEffectIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />
    }
  }

  const getEffectColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600 bg-green-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (probability: string, impact: string) => {
    if (probability === 'high' || impact === 'high') return 'border-red-300 bg-red-50'
    if (probability === 'medium' || impact === 'medium') return 'border-yellow-300 bg-yellow-50'
    return 'border-green-300 bg-green-50'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Simulation</h1>
          <p className="mt-2 text-gray-600">
            Test "what-if" scenarios with clear assumptions, risks, and A/B testing plans
          </p>
        </div>
      </div>

      {/* Scenario Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Run New Simulation</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-2">
              What scenario would you like to test?
            </label>
            <input
              type="text"
              id="scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., What if I post 2 case studies per week?"
            />
            <p className="mt-1 text-xs text-gray-500">
              Examples: "What if I post daily?" or "What if I focus only on video content?"
            </p>
          </div>
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={running}
              className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {running && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {running ? 'Running...' : 'Run Simulation'}
              <Play className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
        
        {error && !simulationData && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Previous Simulations */}
      {simulations.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Simulations</h2>
          <div className="space-y-2">
            {simulations.slice(1, 6).map((sim, index) => (
              <button
                key={sim.id}
                onClick={() => setSimulationData(sim.simulation_data)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{sim.scenario}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(sim.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {simulationData && (
        <>
          {/* Disclaimer */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-lg font-bold text-yellow-900">
                {simulationData.disclaimer.important_notice}
              </h2>
            </div>
            <p className="text-yellow-800 mb-3">{simulationData.disclaimer.explanation}</p>
            <p className="text-sm font-medium text-yellow-900">
              {simulationData.disclaimer.recommended_action}
            </p>
          </div>

          {/* Current Scenario */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scenario Analysis</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{simulationData.scenario}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Frequency:</span>
                  <div className="text-blue-700">{simulationData.scenario_analysis.frequency}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Content Type:</span>
                  <div className="text-blue-700">{simulationData.scenario_analysis.contentType}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Platform:</span>
                  <div className="text-blue-700">{simulationData.scenario_analysis.platform}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Current Frequency:</span>
                  <div className="text-blue-700">{simulationData.scenario_analysis.currentFrequency}/week</div>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Effects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Expected Effects
              </h2>
              <button
                onClick={() => toggleSection('effects')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === 'effects' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(simulationData.expected_effects).map(([key, effect]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 capitalize flex items-center">
                      {key === 'authority' && <Target className="w-4 h-4 mr-1 text-purple-600" />}
                      {key === 'warmth' && <Users className="w-4 h-4 mr-1 text-green-600" />}
                      {key === 'reach' && <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />}
                      {key === 'replies' && <MessageCircle className="w-4 h-4 mr-1 text-orange-600" />}
                      {key}
                    </h3>
                    {getEffectIcon(effect.direction)}
                  </div>
                  
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                    getEffectColor(effect.direction)
                  }`}>
                    {effect.direction} / {effect.magnitude}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{effect.explanation}</p>
                  
                  {expandedSection === 'effects' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                        getConfidenceColor(effect.confidence)
                      }`}>
                        {Math.round(effect.confidence * 100)}% confidence
                      </div>
                      <div className="text-xs text-gray-500">
                        Timeline: {effect.timeline}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                Key Assumptions
              </h2>
              <button
                onClick={() => toggleSection('assumptions')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === 'assumptions' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(simulationData.assumptions).map(([category, assumptions]) => (
                <div key={category}>
                  <h3 className="font-medium text-gray-900 mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <ul className="space-y-2">
                    {(assumptions as string[]).slice(0, expandedSection === 'assumptions' ? undefined : 2).map((assumption, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        {assumption}
                      </li>
                    ))}
                    {!expandedSection && assumptions.length > 2 && (
                      <li className="text-xs text-gray-500">...and {assumptions.length - 2} more</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Risk Analysis
              </h2>
              <button
                onClick={() => toggleSection('risks')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === 'risks' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-6">
              {Object.entries(simulationData.risks).map(([category, risks]) => (
                <div key={category}>
                  <h3 className="font-medium text-gray-900 mb-3 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-3">
                    {(risks as any[]).map((risk, idx) => (
                      <div key={idx} className={`border rounded-lg p-4 ${
                        getRiskColor(risk.probability, risk.impact)
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              risk.probability === 'high' ? 'bg-red-200 text-red-800' :
                              risk.probability === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {risk.probability} prob.
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              risk.impact === 'high' ? 'bg-red-200 text-red-800' :
                              risk.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {risk.impact} impact
                            </span>
                          </div>
                        </div>
                        
                        {expandedSection === 'risks' && (
                          <div className="text-sm text-gray-600">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* A/B Test Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                A/B Test Plan
              </h2>
              <button
                onClick={() => toggleSection('abtest')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === 'abtest' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Hypothesis</h3>
                <p className="text-green-800">{simulationData.ab_test_plan.hypothesis}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Test Design</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Control:</strong> {simulationData.ab_test_plan.test_design.control_group}</div>
                    <div><strong>Treatment:</strong> {simulationData.ab_test_plan.test_design.treatment_group}</div>
                    <div><strong>Duration:</strong> {simulationData.ab_test_plan.test_design.duration}</div>
                    {expandedSection === 'abtest' && (
                      <div><strong>Sample Size:</strong> {simulationData.ab_test_plan.test_design.sample_size_justification}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Primary Metrics</h3>
                  <div className="space-y-2">
                    {simulationData.ab_test_plan.primary_metrics.map((metric, idx) => (
                      <div key={idx} className="text-sm border border-gray-200 rounded p-2">
                        <div className="font-medium">{metric.metric}</div>
                        <div className="text-gray-600">Target: {metric.target}</div>
                        {expandedSection === 'abtest' && (
                          <div className="text-xs text-gray-500">{metric.measurement}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {expandedSection === 'abtest' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Analysis Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div><strong>Weekly Checkpoints:</strong> {simulationData.ab_test_plan.analysis_plan.weekly_checkpoints}</div>
                    <div><strong>Mid-point Analysis:</strong> {simulationData.ab_test_plan.analysis_plan.mid_point_analysis}</div>
                    <div><strong>Final Analysis:</strong> {simulationData.ab_test_plan.analysis_plan.final_analysis}</div>
                    <div><strong>Decision Criteria:</strong> {simulationData.ab_test_plan.analysis_plan.decision_criteria}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}