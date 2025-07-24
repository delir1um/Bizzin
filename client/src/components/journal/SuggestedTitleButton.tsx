import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SuggestedTitleButtonProps {
  suggestedTitle: string;
  onUseSuggestion: (title: string) => void;
  isVisible: boolean;
}

export function SuggestedTitleButton({ 
  suggestedTitle, 
  onUseSuggestion, 
  isVisible 
}: SuggestedTitleButtonProps) {
  if (!isVisible || !suggestedTitle) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
      <Sparkles className="w-4 h-4 text-orange-600" />
      <div className="flex-1">
        <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">
          AI suggests:
        </p>
        <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
          "{suggestedTitle}"
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onUseSuggestion(suggestedTitle)}
        className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
      >
        Use Title
      </Button>
    </div>
  );
}