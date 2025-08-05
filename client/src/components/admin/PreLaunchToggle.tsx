import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Rocket, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformSettings {
  id: string;
  pre_launch_mode: boolean;
  launch_message: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export function PreLaunchToggle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMessage, setEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState('');

  // Fetch current platform settings
  const { data: settings, isLoading, error: settingsError } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      console.log('Fetching platform settings...');
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1);

      console.log('Platform settings query result:', { data, error });

      if (error) {
        console.error('Platform settings error:', error);
        // Return default settings if table doesn't exist
        return {
          id: 'default',
          pre_launch_mode: false,
          launch_message: "We're putting the finishing touches on *Bizzin*! Sign up to be notified when we launch.",
          maintenance_mode: false,
          maintenance_message: "We're currently performing maintenance. Please check back soon."
        } as PlatformSettings;
      }

      if (!data || data.length === 0) {
        console.log('No settings found, creating default...');
        
        // Try to insert default settings
        const defaultSettings = {
          pre_launch_mode: false,
          launch_message: "We're putting the finishing touches on *Bizzin*! Sign up to be notified when we launch.",
          maintenance_mode: false,
          maintenance_message: "We're currently performing maintenance. Please check back soon."
        };

        const { data: newData, error: insertError } = await supabase
          .from('platform_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          // Return default if insert fails
          return {
            id: 'default',
            ...defaultSettings
          } as PlatformSettings;
        }
        
        console.log('Created new settings:', newData);
        return newData as PlatformSettings;
      }

      return data[0] as PlatformSettings;
    }
  });

  // Toggle pre-launch mode
  const togglePreLaunchMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      console.log('Toggling pre-launch mode to:', enabled);
      console.log('Current settings:', settings);
      
      if (!settings) throw new Error('Settings not loaded');

      if (settings.id === 'default') {
        // If using default settings, create a real record first
        console.log('Creating real settings record...');
        const { data: newData, error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            pre_launch_mode: enabled,
            launch_message: settings.launch_message,
            maintenance_mode: settings.maintenance_mode,
            maintenance_message: settings.maintenance_message
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        
        console.log('New settings created:', newData);
        return enabled;
      }

      console.log('Updating existing settings...');
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          pre_launch_mode: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Settings updated successfully');
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast({
        title: enabled ? 'Pre-Launch Mode Enabled' : 'Pre-Launch Mode Disabled',
        description: enabled 
          ? 'New user signups will be captured as early leads' 
          : 'Users can now register and access the full platform',
      });
    },
    onError: (error) => {
      console.error('Pre-launch toggle error:', error);
      toast({
        title: 'Database Error',
        description: error?.message || 'Failed to update pre-launch mode. Check if platform_settings table exists.',
        variant: 'destructive'
      });
    }
  });

  // Update launch message
  const updateMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!settings) throw new Error('Settings not loaded');

      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          launch_message: message,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setEditingMessage(false);
      toast({
        title: 'Message Updated',
        description: 'Pre-launch message has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update launch message',
        variant: 'destructive'
      });
      console.error('Message update error:', error);
    }
  });

  const handleToggle = (checked: boolean) => {
    togglePreLaunchMode.mutate(checked);
  };

  const handleMessageEdit = () => {
    setTempMessage(settings?.launch_message || '');
    setEditingMessage(true);
  };

  const handleMessageSave = () => {
    updateMessage.mutate(tempMessage);
  };

  const handleMessageCancel = () => {
    setEditingMessage(false);
    setTempMessage('');
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-orange-200 dark:bg-orange-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
          {settings?.pre_launch_mode ? (
            <Construction className="w-5 h-5" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
          Pre-Launch Control
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Control whether new users can access the platform or are captured as early signups
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pre-launch-mode" className="text-orange-900 dark:text-orange-100 font-medium">
              Pre-Launch Mode
            </Label>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {settings?.pre_launch_mode 
                ? 'Platform is in pre-launch - collecting early signups'
                : 'Platform is live - users can register and access features'
              }
            </p>
          </div>
          <Switch
            id="pre-launch-mode"
            checked={settings?.pre_launch_mode || false}
            onCheckedChange={handleToggle}
            disabled={togglePreLaunchMode.isPending}
            className="data-[state=checked]:bg-orange-600"
          />
        </div>

        {/* Launch Message Editor */}
        {settings?.pre_launch_mode && (
          <div className="space-y-3 pt-4 border-t border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <Label className="text-orange-900 dark:text-orange-100 font-medium">
                Pre-Launch Message
              </Label>
              {!editingMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMessageEdit}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {editingMessage ? (
              <div className="space-y-3">
                <Textarea
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                  placeholder="Enter the message users will see during pre-launch..."
                  className="bg-white dark:bg-orange-950 border-orange-300 dark:border-orange-700"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleMessageSave}
                    disabled={updateMessage.isPending || !tempMessage.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessageCancel}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {settings?.launch_message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm pt-2">
          <div className={`w-2 h-2 rounded-full ${
            settings?.pre_launch_mode 
              ? 'bg-orange-500 animate-pulse' 
              : 'bg-green-500'
          }`} />
          <span className="text-orange-700 dark:text-orange-300">
            Status: {settings?.pre_launch_mode ? 'Pre-Launch Mode' : 'Live Platform'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}