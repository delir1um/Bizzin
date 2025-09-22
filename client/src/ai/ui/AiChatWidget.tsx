import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useClaudeChat } from './useClaudeChat';

interface AiChatWidgetProps {
  title?: string;
  className?: string;
}

export function AiChatWidget({ title = "AI Assistant", className = "" }: AiChatWidgetProps) {
  const { messages, send, isLoading, error, clearMessages } = useClaudeChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const prompt = inputValue.trim();
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await send(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <div className={`ai-chat-widget ${className}`}>
      <style>{`
        .ai-chat-widget {
          display: flex;
          flex-direction: column;
          height: 500px;
          max-width: 600px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .ai-chat-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ai-chat-title {
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .ai-chat-clear-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        
        .ai-chat-clear-btn:hover {
          color: #ef4444;
        }
        
        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .ai-chat-message {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        
        .ai-chat-message.user {
          align-self: flex-end;
          background: #3b82f6;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .ai-chat-message.assistant {
          align-self: flex-start;
          background: #f1f5f9;
          color: #1e293b;
          border-bottom-left-radius: 4px;
        }
        
        .ai-chat-message.assistant.loading {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        
        .ai-chat-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          border: 1px solid #fecaca;
        }
        
        .ai-chat-form {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 0 0 8px 8px;
        }
        
        .ai-chat-input-container {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        
        .ai-chat-textarea {
          flex: 1;
          resize: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          font-size: 14px;
          line-height: 1.4;
          min-height: 44px;
          max-height: 120px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .ai-chat-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ai-chat-send-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
        }
        
        .ai-chat-send-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .ai-chat-send-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .ai-chat-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-style: italic;
        }
        
        .ai-chat-typing {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;
        }
        
        .ai-chat-usage {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }
      `}</style>
      
      {/* Header */}
      <div className="ai-chat-header">
        <h3 className="ai-chat-title" data-testid="text-chat-title">{title}</h3>
        <button
          type="button"
          onClick={clearMessages}
          className="ai-chat-clear-btn"
          title="Clear conversation"
          data-testid="button-clear-chat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages" data-testid="container-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty" data-testid="text-empty-state">
            Start a conversation with the AI assistant
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-chat-message ${message.role} ${isLoading && index === messages.length - 1 && message.role === 'assistant' ? 'loading' : ''}`}
            data-testid={`message-${message.role}-${index}`}
          >
            {message.content || (
              <div className="ai-chat-typing">
                <Loader2 size={12} className="animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="ai-chat-error" data-testid="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="ai-chat-form">
        <div className="ai-chat-input-container">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="ai-chat-textarea"
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="ai-chat-send-btn"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}