import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bot, User, Lightbulb, Activity, HelpCircle } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useTranslation } from 'react-i18next';

const Chat = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const { messages, sendMessage, isLoading } = useChatbot();
  const { t, i18n } = useTranslation();

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;
    
    await sendMessage(currentMessage);
    setCurrentMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentMessage(question);
    handleSendMessage();
  };

  const quickQuestions = [
    "¿Cuál es el estado actual del sistema hidroeléctrico?",
    "¿Cómo puedo optimizar mi generación solar?",
    "¿Qué significa mi saldo de créditos?",
    "¿Cómo funciona el sistema de transferencias?",
    "¿Cuáles son los niveles de emisiones actuales?",
    "¿Qué es un gemelo digital?",
    "¿Cómo canjeo créditos en el kiosco?",
    "¿Qué hacer en caso de alerta ambiental?"
  ];

  const contextualMessages = messages.filter(m => m.usedContext).length;
  const totalBotMessages = messages.filter(m => m.isBot).length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('chatbot', 'Chatbot')}</h1>
          <p className="text-muted-foreground">
            Asistente inteligente para consultas energéticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {contextualMessages}/{totalBotMessages} con contexto
          </Badge>
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                Asistente EnerRed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${
                      msg.isBot ? '' : 'flex-row-reverse space-x-reverse'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>
                        {msg.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                        msg.isBot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">{msg.timestamp}</p>
                        {msg.isBot && msg.usedContext && (
                          <Badge variant="secondary" className="text-xs">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Con contexto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Preguntas Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.slice(0, 4).map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full text-left text-xs h-auto py-2 px-2 whitespace-normal"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-left text-xs"
                onClick={() => handleQuickQuestion("¿Cuál es la producción actual de energía?")}
                disabled={isLoading}
              >
                Producción energética
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-left text-xs"
                onClick={() => handleQuickQuestion("¿Hay alertas activas en el sistema?")}
                disabled={isLoading}
              >
                Alertas activas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-left text-xs"
                onClick={() => handleQuickQuestion("¿Cuál es el pronóstico para mañana?")}
                disabled={isLoading}
              >
                Pronóstico energético
              </Button>
            </CardContent>
          </Card>

          {/* Language Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Idioma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={i18n.language === 'es' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full"
                  onClick={() => i18n.changeLanguage('es')}
                >
                  Español
                </Button>
                <Button
                  variant={i18n.language === 'qu' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full"
                  onClick={() => i18n.changeLanguage('qu')}
                >
                  Quechua
                </Button>
                <Button
                  variant={i18n.language === 'ay' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full"
                  onClick={() => i18n.changeLanguage('ay')}
                >
                  Aimara
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Mensajes totales:</span>
                <span>{messages.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Con contexto:</span>
                <span>{contextualMessages}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Precisión:</span>
                <span>{totalBotMessages > 0 ? Math.round((contextualMessages / totalBotMessages) * 100) : 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;