import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  usedContext?: boolean;
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente de EnerRed. ¿En qué puedo ayudarte hoy?',
      isBot: true,
      timestamp: new Date().toLocaleTimeString(),
      usedContext: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString(),
      usedContext: false
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          question: messageText,
          user_id: user?.id || null,
          include_context: true
        }
      });

      if (error) throw error;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.answer || 'Lo siento, no pude procesar tu consulta.',
        isBot: true,
        timestamp: new Date().toLocaleTimeString(),
        usedContext: data.used_context || false
      };

      setMessages(prev => [...prev, botMessage]);

      // Log the interaction
      if (user?.id) {
        await supabase.from('chatbot_logs').insert({
          user_id: user.id,
          question: messageText,
          answer: data.answer || 'Error en respuesta',
          used_context: data.used_context || false
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.',
        isBot: true,
        timestamp: new Date().toLocaleTimeString(),
        usedContext: false
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading
  };
}