// Daily Email Setup Component - Quick setup from dashboard
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';

interface DailyEmailSetupProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function DailyEmailSetup({ onComplete, compact = false }: DailyEmailSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    enabled: false,
    send_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Quick setup mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('daily_email_settings')
        .upsert({
          user_id: user.id,
          enabled: settings.enabled,
          send_time: settings.send_time,
          timezone: settings.timezone,
          content_preferences: {
            journal_prompts: true,
            goal_summaries: true,
            business_insights: true,
            milestone_reminders: true,
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-email-settings'] });
      toast({
        title: "Daily Email Setup Complete",
        description: `You'll receive daily insights at ${settings.send_time} starting tomorrow.`,
      });
      onComplete?.();
    },
    onError: (error) => {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: "Unable to setup daily emails. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const timeOptions = [
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
  ];

  if (compact) {
    return (
      <Card className="border-dashed border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Daily Business Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get personalized journal prompts and goal updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enabled}
                onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
              />
              {settings.enabled && (
                <Button 
                  size="sm" 
                  onClick={handleSetup}
                  disabled={setupMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {setupMutation.isPending ? 'Setting up...' : 'Enable'}
                </Button>
              )}
            </div>
          </div>
          
          {settings.enabled && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Select 
                  value={settings.send_time} 
                  onValueChange={(send_time) => setSettings(prev => ({ ...prev, send_time }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Link href="/settings/notifications">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                  More settings
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-6 w-6 text-orange-500" />
          Daily Business Insights
        </CardTitle>
        <CardDescription>
          Get personalized journal prompts, goal updates, and business insights delivered to your inbox
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-emails">Enable Daily Emails</Label>
          <Switch
            id="enable-emails"
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
          />
        </div>
        
        {settings.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Label>Delivery Time</Label>
            </div>
            
            <Select 
              value={settings.send_time} 
              onValueChange={(send_time) => setSettings(prev => ({ ...prev, send_time }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <p className="text-xs text-gray-500">
              Timezone: {settings.timezone}
            </p>
          </div>
        )}
        
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSetup}
            disabled={setupMutation.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {setupMutation.isPending ? 'Setting up...' : 'Setup Daily Emails'}
          </Button>
          
          <Link href="/settings/notifications">
            <Button variant="outline" size="sm">
              Advanced
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}