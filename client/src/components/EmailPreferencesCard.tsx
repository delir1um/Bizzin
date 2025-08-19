// Email Preferences Card for Dashboard
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Settings, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';
import { DailyEmailSetup } from './DailyEmailSetup';

export function EmailPreferencesCard() {
  const { user } = useAuth();

  // Fetch current email settings
  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ['daily-email-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('daily_email_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "not found" error
        throw error;
      }

      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show setup component if no settings exist
  if (!emailSettings) {
    return <DailyEmailSetup compact />;
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-orange-500" />
          Daily Email Digest
        </CardTitle>
        <CardDescription>
          Your personalized business insights and journal prompts
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {emailSettings.enabled ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Active
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">
                  Disabled
                </span>
              </>
            )}
          </div>
          
          {emailSettings.enabled && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(emailSettings.send_time)}
            </Badge>
          )}
        </div>

        {/* Content Preferences Summary */}
        {emailSettings.enabled && emailSettings.content_preferences && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content Includes:
            </div>
            <div className="flex flex-wrap gap-2">
              {emailSettings.content_preferences.journal_prompts && (
                <Badge variant="secondary" className="text-xs">Journal Prompts</Badge>
              )}
              {emailSettings.content_preferences.goal_summaries && (
                <Badge variant="secondary" className="text-xs">Goal Updates</Badge>
              )}
              {emailSettings.content_preferences.business_insights && (
                <Badge variant="secondary" className="text-xs">Business Insights</Badge>
              )}
              {emailSettings.content_preferences.milestone_reminders && (
                <Badge variant="secondary" className="text-xs">Milestone Alerts</Badge>
              )}
            </div>
          </div>
        )}

        {/* Next Email Info */}
        {emailSettings.enabled && (
          <div className="text-xs text-gray-500">
            Next email: Tomorrow at {formatTime(emailSettings.send_time)} ({emailSettings.timezone})
          </div>
        )}

        {/* Settings Button */}
        <div className="pt-2">
          <Link href="/settings/notifications">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Manage Email Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}