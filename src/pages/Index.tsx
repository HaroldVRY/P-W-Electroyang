import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Gauge, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
              <span className="text-white font-bold text-3xl">E</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              EnerTwin
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Gemelo digital hidroeléctrico y sistema de créditos energéticos comunitarios
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Button asChild size="lg" className="bg-gradient-primary hover:shadow-primary transition-all">
                <Link to="/dashboard">
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-primary hover:shadow-primary transition-all">
                  <Link to="/auth">
                    Iniciar Sesión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/demo">Ver Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Gauge className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Gemelo Digital</CardTitle>
              <CardDescription>
                Simulación en tiempo real de la central hidroeléctrica con pronósticos avanzados
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-secondary/20 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>EnerRed</CardTitle>
              <CardDescription>
                Sistema de créditos energéticos para intercambio comunitario de energía limpia
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Monitoreo</CardTitle>
              <CardDescription>
                Sensores ambientales en tiempo real con detección de anomalías automática
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
