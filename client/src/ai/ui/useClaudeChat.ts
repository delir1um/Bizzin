import { useState, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system?: string;
  cacheSystem?: boolean;
  enableTools?: boolean;
}

interface UseClaudeChatReturn {
  messages: ChatMessage[];
  send: (prompt: string, options?: ChatOptions) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearMessages: () => void;
}

export function useClaudeChat(): UseClaudeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(async (prompt: string, options: ChatOptions = {}) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message optimistically
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare request body
      const requestBody = {
        prompt: prompt.trim(),
        stream: true,
        ...options,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      // Create EventSource for streaming
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      // Add placeholder for assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.token) {
                  assistantText += data.token;
                  // Update assistant message in real-time
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...assistantMessage,
                      content: assistantText
                    };
                    return newMessages;
                  });
                }

                if (data.done) {
                  // Final update with complete text
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...assistantMessage,
                      content: data.fullText || assistantText
                    };
                    return newMessages;
                  });
                  break;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Remove the placeholder assistant message on error
      setMessages(prev => prev.slice(0, -1));
      
      console.error('Chat error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return {
    messages,
    send,
    isLoading,
    error,
    clearMessages
  };
}