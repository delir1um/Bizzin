// Notification Management Component for Profile Page
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, Bell, Send, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';

interface DailyEmailSettings {
  id?: string;
  user_id: string;
  enabled: boolean;
  send_time: string;
  timezone: string;
  content_preferences: {
    journal_prompts: boolean;
    goal_summaries: boolean;
    business_insights: boolean;
    milestone_reminders: boolean;
  };
}

export function NotificationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<DailyEmailSettings>({
    user_id: user?.id || '',
    enabled: false,
    send_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    content_preferences: {
      journal_prompts: true,
      goal_summaries: true,
      business_insights: true,
      milestone_reminders: true,
    }
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
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

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    } else if (user?.id) {
      // Set default user_id if no settings exist
      setSettings(prev => ({ ...prev, user_id: user.id }));
    }
  }, [currentSettings, user?.id]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: DailyEmailSettings) => {
      if (currentSettings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('daily_email_settings')
          .update(newSettings)
          .eq('id', currentSettings.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('daily_email_settings')
          .insert(newSettings)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-email-settings'] });
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for a preview of your daily email.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleTestEmail = () => {
    sendTestEmailMutation.mutate();
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return {
      value: `${hour}:00`,
      label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`
    };
  });

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            Daily Email Digest
          </CardTitle>
          <CardDescription>
            Get personalized business insights, journal prompts, and goal updates delivered to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-email-enabled" className="text-base font-medium">
                Enable Daily Emails
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive daily business insights and journal prompts
              </p>
            </div>
            <Switch
              id="daily-email-enabled"
              checked={settings.enabled}
              onCheckedChange={(enabled) => 
                setSettings(prev => ({ ...prev, enabled }))
              }
            />
          </div>

          <Separator />

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Clock className="h-4 w-4" />
              Delivery Time
            </Label>
            <Select 
              value={settings.send_time} 
              onValueChange={(send_time) => 
                setSettings(prev => ({ ...prev, send_time }))
              }
              disabled={!settings.enabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Timezone: {settings.timezone}
            </p>
          </div>

          <Separator />

          {/* Content Preferences */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Bell className="h-4 w-4" />
              Content Preferences
            </Label>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="journal-prompts">Journal Prompts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI-generated prompts based on your business journey
                  </p>
                </div>
                <Switch
                  id="journal-prompts"
                  checked={settings.content_preferences.journal_prompts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      content_preferences: { ...prev.content_preferences, journal_prompts: checked }
                    }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goal-summaries">Goal Summaries</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Progress updates and upcoming deadlines
                  </p>
                </div>
                <Switch
                  id="goal-summaries"
                  checked={settings.content_preferences.goal_summaries}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      content_preferences: { ...prev.content_preferences, goal_summaries: checked }
                    }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="business-insights">Business Insights</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI-powered analysis of your business health
                  </p>
                </div>
                <Switch
                  id="business-insights"
                  checked={settings.content_preferences.business_insights}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      content_preferences: { ...prev.content_preferences, business_insights: checked }
                    }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="milestone-reminders">Milestone Reminders</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upcoming milestone deadlines and suggestions
                  </p>
                </div>
                <Switch
                  id="milestone-reminders"
                  checked={settings.content_preferences.milestone_reminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      content_preferences: { ...prev.content_preferences, milestone_reminders: checked }
                    }))
                  }
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-save-settings"
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestEmail}
              disabled={sendTestEmailMutation.isPending || !settings.enabled}
              data-testid="button-send-test"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendTestEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
          
          {settings.enabled && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Next email will be sent at {formatTime(settings.send_time)} ({settings.timezone})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}