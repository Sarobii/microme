import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Target,
  Calendar,
  Edit3,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

interface StrategyData {
  goal: string;
  week_plan: Array<{
    day: string;
    topic_theme: string;
    format: string;
    call_to_action: string;
    rationale: string;
    evidence_link: string;
  }>;
  three_drafts: Array<{
    title: string;
    content: string;
    hashtags: string[];
    rationale: string;
    persona_evidence: string;
  }>;
  voice_guide: Array<{
    principle: string;
    description: string;
    rationale: string;
  }>;
  strategy_metadata: {
    based_on_persona_date: string;
    posts_analyzed: number;
    strategy_confidence: number;
    created_at: string;
  };
}

export const ContentStrategy: React.FC = () => {
  const { user } = useAuth();
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [goal, setGoal] = useState("lighthearted authority in AI automation");
  const [copiedDraft, setCopiedDraft] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchStrategy = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("content_strategies")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching strategy:", error);
        setError("Failed to fetch strategy data");
      } else if (data && data.length > 0) {
        setStrategyData(data[0].strategy_data);
        setGoal(data[0].goal);
      } else {
        setError("No strategy found. Generate your first strategy below.");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const generateStrategy = async () => {
    setGenerating(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "strategy-planner",
        {
          body: { goal },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (error) {
        console.error("Strategy generation error:", error);
        setError(`Strategy generation failed: ${error.message}`);
      } else {
        console.log("Strategy result:", data);
        await fetchStrategy(); // Refresh data
      }
    } catch (err: any) {
      console.error("Error generating strategy:", err);
      setError(err.message || "Strategy generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyDraftContent = async (draftIndex: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedDraft(draftIndex);
      setTimeout(() => setCopiedDraft(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Strategy</h1>
          <p className="mt-2 text-gray-600">
            AI-powered content recommendations based on your persona analysis
          </p>
        </div>
      </div>

      {/* Goal Setting */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Strategic Goal
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              What do you want to achieve with your content?
            </label>
            <input
              type="text"
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., lighthearted authority in AI automation"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateStrategy}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {generating ? "Generating..." : "Generate Strategy"}
            </button>
          </div>
        </div>

        {error && !strategyData && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {strategyData && (
        <>
          {/* Strategy Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {strategyData.strategy_metadata.posts_analyzed}
                </div>
                <div className="text-sm text-gray-500">Posts Analyzed</div>
              </div>
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getConfidenceColor(
                    strategyData.strategy_metadata.strategy_confidence
                  )}`}
                >
                  {Math.round(
                    strategyData.strategy_metadata.strategy_confidence * 100
                  )}
                  % Confidence
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Strategy Confidence
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-900">
                  {new Date(
                    strategyData.strategy_metadata.based_on_persona_date
                  ).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Based on Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-900">
                  {new Date(
                    strategyData.strategy_metadata.created_at
                  ).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Strategy Created</div>
              </div>
            </div>
          </div>

          {/* Week Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Weekly Content Plan
              </h2>
              <button
                onClick={() => toggleSection("weekplan")}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === "weekplan" ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategyData.week_plan.map((plan, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{plan.day}</h3>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Topic:</span>
                      <span className="ml-2 text-gray-600">
                        {plan.topic_theme}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Format:</span>
                      <span className="ml-2 text-gray-600">{plan.format}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">CTA:</span>
                      <span className="ml-2 text-gray-600">
                        {plan.call_to_action}
                      </span>
                    </div>
                  </div>

                  {expandedSection === "weekplan" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">
                          <strong>Rationale:</strong> {plan.rationale}
                        </div>
                        <div>
                          <strong>Evidence:</strong> {plan.evidence_link}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Three Drafts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Edit3 className="w-5 h-5 mr-2 text-green-600" />
                Content Drafts
              </h2>
              <button
                onClick={() => toggleSection("drafts")}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === "drafts" ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="space-y-6">
              {strategyData.three_drafts.map((draft, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{draft.title}</h3>
                    <button
                      onClick={() => copyDraftContent(index, draft.content)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-500"
                    >
                      {copiedDraft === index ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {draft.content}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {draft.hashtags.map((hashtag, hidx) => (
                      <span
                        key={hidx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>

                  {expandedSection === "drafts" && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          <strong>Rationale:</strong> {draft.rationale}
                        </div>
                        <div>
                          <strong>Persona Evidence:</strong>{" "}
                          {draft.persona_evidence}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Voice Guide */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                Voice & Style Guide
              </h2>
              <button
                onClick={() => toggleSection("voice")}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSection === "voice" ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategyData.voice_guide.map((guide, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {guide.principle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {guide.description}
                  </p>

                  {expandedSection === "voice" && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <strong>Rationale:</strong> {guide.rationale}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Human Review Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  Human Review Required
                </h4>
                <p className="text-sm text-amber-800 mt-1">
                  These AI-generated recommendations are based on your content
                  patterns and stated goals. Please review each suggestion
                  carefully and adapt them to your specific context, brand
                  voice, and current market conditions. Consider A/B testing
                  different approaches to validate effectiveness.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
