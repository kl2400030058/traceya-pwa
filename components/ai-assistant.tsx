'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Send, User, Loader2, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import { authManager } from '@/lib/auth';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

interface AIAssistantProps {
  initialPrompt?: string;
  minimized?: boolean;
  onMinimizeToggle?: (minimized: boolean) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  initialPrompt,
  minimized = false,
  onMinimizeToggle,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock AI response function - in a real app, this would call an API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! How can I help you with Traceya today?';
    } else if (lowerMessage.includes('help')) {
      return 'I can help you with tracking products, understanding verification processes, or navigating the application. What specifically do you need assistance with?';
    } else if (lowerMessage.includes('track') || lowerMessage.includes('product')) {
      return 'To track a product, you can use the search function with a batch ID or scan the QR code on the product packaging. Would you like me to guide you through the process?';
    } else if (lowerMessage.includes('verification') || lowerMessage.includes('verify')) {
      return 'Our verification system uses zero-knowledge proofs to verify claims without revealing sensitive information. You can verify products in the Verification Portal. Would you like to learn more about how it works?';
    } else if (lowerMessage.includes('ipfs') || lowerMessage.includes('storage')) {
      return 'We use IPFS (InterPlanetary File System) for decentralized storage of documents and images. This ensures data integrity and availability. Would you like to know more about how we implement IPFS?';
    } else if (lowerMessage.includes('zkp') || lowerMessage.includes('zero-knowledge')) {
      return 'Zero-Knowledge Proofs (ZKPs) allow us to verify information without revealing the underlying data. This technology is crucial for privacy-preserving verification in our supply chain. Would you like a specific example of how we use ZKPs?';
    } else {
      return 'I understand you\'re asking about "' + userMessage + '". While I\'m still learning, I\'d be happy to help you find information about this topic. Could you provide more details about what you\'re looking for?';
    }
  };

  useEffect(() => {
    // Add initial assistant message if no messages exist
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: 'initial',
        content: initialPrompt || 'Hello! I\'m your Traceya assistant. How can I help you today?',
        role: 'assistant',
        timestamp: Date.now(),
      };
      setMessages([initialMessage]);
    }
  }, [initialPrompt, messages.length]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAIResponse(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (onMinimizeToggle) {
      onMinimizeToggle(newState);
    }
  };

  // If minimized, show only the header
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 shadow-lg rounded-lg overflow-hidden z-50">
        <div 
          className="bg-primary text-primary-foreground p-3 cursor-pointer flex justify-between items-center"
          onClick={toggleMinimize}
        >
          <div className="flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            <span className="font-medium">Traceya Assistant</span>
          </div>
          <Maximize2 className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 md:w-96 shadow-lg z-50 flex flex-col max-h-[500px]">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-primary text-primary-foreground">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <CardTitle className="text-base">Traceya Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-8 w-8 text-primary-foreground">
          <Minimize2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto flex-grow">
        <div className="flex flex-col p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-blue-100' : 'bg-primary/10'}`}>
                  {message.role === 'user' ? (
                    <>
                      <AvatarImage src="/avatars/user.png" alt="User" />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/avatars/assistant.png" alt="Assistant" />
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div 
                  className={`rounded-lg px-3 py-2 text-sm ${message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'}`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-row items-start gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8 bg-primary/10">
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 text-sm bg-muted flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-start">
              <div className="flex flex-row items-start gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8 bg-red-100">
                  <AvatarFallback><XCircle className="h-4 w-4 text-red-500" /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 text-sm bg-red-50 text-red-500 border border-red-200">
                  {error}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;