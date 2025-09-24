import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, TrendingUp, CheckCircle2, AlertTriangle, RefreshCw, Info, Tag } from "lucide-react";
// Types for structured insights
interface TInsight {
  summary: string;
  actions: string[];
  risks?: string[];
  sentiment: "Excited" | "Positive" | "Neutral" | "Concerned" | "Stressed";
  confidence: number;
  tags: string[];
}

interface TInsightResponse {
  entry_id: string;
  model_version: string;
  grounded_on: {
    entry_chars: number;
    recent_entries_used: number;
    goals_used: number;
  };
  insight: TInsight;
}
import type { JournalEntry } from "@/types/journal";
import { useToast } from "@/hooks/use-toast";

interface EnhancedInsightsProps {
  entry: JournalEntry;
  className?: string;
}

interface InsightGenerationState {
  isLoading: boolean;
  insight: TInsightResponse | null;
  error: string | null;
}

// Sentiment color mapping for confidence badges
const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'Excited': return 'text-green-700 bg-green-100 border-green-200';
    case 'Positive': return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'Neutral': return 'text-gray-700 bg-gray-100 border-gray-200';
    case 'Concerned': return 'text-orange-700 bg-orange-100 border-orange-200';
    case 'Stressed': return 'text-red-700 bg-red-100 border-red-200';
    default: return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

export function EnhancedInsights({ entry, className = "" }: EnhancedInsightsProps) {
  const [state, setState] = useState<InsightGenerationState>({
    isLoading: false,
    insight: null,
    error: null
  });
  const { toast } = useToast();

  // Generate insights on component mount
  useEffect(() => {
    generateInsights();
  }, [entry.id]);

  const generateInsights = async () => {
    if (!entry.content || entry.content.length < 30) {
      setState({
        isLoading: false,
        insight: null,
        error: "Entry too short for meaningful analysis"
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Fetch recent entries and goals for better context
      const recentEntries: string[] = [];
      const goals: string[] = [];

      const response = await fetch('/api/ai/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry_id: entry.id,
          entry_text: entry.content,
          entry_mood: entry.sentiment_data?.primary_mood,
          entry_energy: entry.sentiment_data?.energy,
          recent_entries: recentEntries,
          goals: goals,
          user_id: entry.user_id
        })
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errorData = await response.json();
          setState({
            isLoading: false,
            insight: null,
            error: errorData.error || "Not enough context to generate insights"
          });
          return;
        }
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const insight: TInsightResponse = await response.json();
      setState({
        isLoading: false,
        insight,
        error: null
      });

    } catch (error) {
      console.error('Insights generation error:', error);
      setState({
        isLoading: false,
        insight: null,
        error: error instanceof Error ? error.message : 'Failed to generate insights'
      });
      
      toast({
        title: "Insights Generation Failed",
        description: "Unable to generate business insights for this entry.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    generateInsights();
  };

  if (state.isLoading) {
    return (
      <Card className={`bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-semibold text-sm">Generating Business Insights...</span>
          </div>
          <div className="mt-3 text-sm text-blue-600">
            Analyzing your entry for specific, actionable guidance...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">Unable to Generate Insights</span>
          </div>
          <div className="mt-2 text-sm text-orange-600">
            {state.error}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="mt-3 text-orange-700 border-orange-300 hover:bg-orange-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!state.insight) {
    return null;
  }

  const { insight, grounded_on, model_version } = state.insight;

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-green-100 border-green-200 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header with confidence and sentiment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <Brain className="w-5 h-5" />
            <span className="font-semibold text-sm">AI Business Coach</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getSentimentColor(insight.sentiment)}`}
            >
              {insight.sentiment}
            </Badge>
            <Badge variant="outline" className="text-xs text-green-700 bg-green-100 border-green-300">
              {Math.round(insight.confidence * 100)}% confident
            </Badge>
          </div>
        </div>

        {/* Main insight summary */}
        <div className="text-sm text-gray-700 bg-white/60 rounded-lg p-3 border border-green-200/50">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
            <p className="leading-relaxed font-medium">{insight.summary}</p>
          </div>
        </div>

        {/* Action items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-sm">Recommended Actions</span>
          </div>
          <div className="space-y-2">
            {insight.actions.map((action: string, index: number) => (
              <div key={index} className="text-sm text-gray-700 bg-white/40 rounded-md p-2 border border-green-200/30">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 text-xs bg-green-200 text-green-800 rounded-full flex items-center justify-center font-medium mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk considerations (if present) */}
        {insight.risks && insight.risks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">Consider These Risks</span>
            </div>
            <div className="space-y-1">
              {insight.risks.map((risk: string, index: number) => (
                <div key={index} className="text-sm text-orange-700 bg-orange-50/60 rounded-md p-2 border border-orange-200/50">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{risk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-green-600" />
            {insight.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs text-green-600 bg-green-50 border-green-200">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer with metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-green-200/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 font-medium">
              {model_version} • Analysed {grounded_on.entry_chars} chars
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-green-500 cursor-help hover:text-green-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    This insight is grounded in your specific journal entry{grounded_on.recent_entries_used > 0 && `, ${grounded_on.recent_entries_used} recent entries`}{grounded_on.goals_used > 0 && `, and ${grounded_on.goals_used} active goals`}. 
                    Confidence shows how certain the AI is about providing relevant advice.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRetry}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}