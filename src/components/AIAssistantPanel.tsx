import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Compass,
  CloudSun,
  Search,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, AgentAction } from '../types';

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested demo prompts from requirements 12 & 13
  const suggestedPrompts = [
    'How do I get from Raffles Place to Marina Bay Sands, and what will the weather be like for the next 2 hours?',
    'Show me cycling directions from Orchard to Gardens by the Bay.',
    "What's the weather around Marina Bay for the next 2 hours?",
    'Show me walking directions from Raffles Place to Marina Bay Sands and check the weather.',
    'Change the current route to cycling.',
    'Swap the starting point and destination.',
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    onSendMessage(msg);
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const renderActionIcon = (toolName: string) => {
    switch (toolName) {
      case 'searchLocation':
      case 'showLocation':
        return <Search className="w-3.5 h-3.5 text-blue-400" />;
      case 'getDirections':
      case 'updateTravelMode':
      case 'swapStartAndDestination':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'getWeatherForecast':
        return <CloudSun className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col h-full max-h-[750px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
              AI Travel Assistant
            </h2>
            <div className="text-[10px] text-neutral-400">
              Agentic OneMap & data.gov.sg integration
            </div>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2 shrink-0">
        <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1.5 flex items-center gap-1">
          <span>Suggested Prompts</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] text-left px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 rounded-lg border border-neutral-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {p.length > 42 ? `${p.slice(0, 42)}...` : p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2 min-h-[220px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-neutral-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span>Assistant</span>
                </>
              )}
            </div>

            {/* Agent Action Steps (Visible Agentic Execution Flow) */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="w-full max-w-[94%] bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2.5 my-1 flex flex-col gap-1.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Agent Actions Executed</span>
                </div>
                <div className="space-y-1">
                  {msg.actions.map((act, aIdx) => (
                    <div
                      key={aIdx}
                      className="text-[11px] flex items-start gap-1.5 text-neutral-300 bg-neutral-900/60 p-1.5 rounded border border-neutral-800/40"
                    >
                      <div className="mt-0.5">{renderActionIcon(act.tool)}</div>
                      <div className="flex-1 min-w-0 font-sans">{act.summary}</div>
                      {act.status === 'success' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`p-3 rounded-xl text-xs max-w-[92%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
              <Bot className="w-3 h-3 text-emerald-400" />
              <span>Assistant</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-2 text-xs text-neutral-300">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing request & querying OneMap & weather APIs...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-neutral-800/80 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Ask assistant (e.g. How do I get from Raffles Place to MBS and what's the weather?)..."
            className="w-full pl-3 pr-10 py-2.5 bg-neutral-950 text-neutral-100 text-xs rounded-xl border border-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 p-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Send query"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
