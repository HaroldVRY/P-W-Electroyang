import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  Zap, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Waves,
  Battery
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useHydroData } from '@/hooks/useHydroData';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';

const Dashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hydroState, forecasts, loading, error, simulateScenario } = useHydroData();
  const [droughtSeverity, setDroughtSeverity] = useState([0.3]);
  const [rainSeverity, setRainSeverity] = useState([0.5]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Process data for charts
  const chartData = useMemo(() => {
    return hydroState.slice(0, 24).reverse().map(state => ({
      time: new Date(state.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      inflow: state.inflow_m3s,
      outflow: state.outflow_m3s,
      level: state.reservoir_level_m,
      generation: state.turbine_mw,
      energy: state.energy_mwh
    }));
  }, [hydroState]);

  const forecastData = useMemo(() => {
    return forecasts.slice(0, 168).reverse().map(forecast => ({
      time: new Date(forecast.ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      inflow: forecast.inflow_pred_m3s,
      energy: forecast.energy_pred_mwh
    }));
  }, [forecasts]);

  const latestState = hydroState[0];

  const handleSimulation = async (scenario: 'sequia' | 'lluvia') => {
    try {
      setIsSimulating(true);
      const severity = scenario === 'sequia' ? droughtSeverity[0] : rainSeverity[0];
      
      await simulateScenario(scenario, severity, 7);
      
      toast({
        title: '✅ Simulación completada',
        description: `Escenario de ${scenario === 'sequia' ? 'sequía' : 'lluvia'} ejecutado con severidad ${Math.round(severity * 100)}%`,
      });
    } catch (error) {
      toast({
        title: '❌ Error en simulación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4" />;
    if (value >= thresholds.warning) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            {t('dashboard')} - Gemelo Digital
          </h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de la central hidroeléctrica
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          {t('online')}
        </Badge>
      </div>

      {/* Current Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('hydro.inflow')}</CardTitle>
            <Waves className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestState?.inflow_m3s?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">m³/s</p>
            <div className="flex items-center mt-2">
              {getStatusIcon(latestState?.inflow_m3s || 0, { warning: 10, critical: 5 })}
              <Badge variant={getStatusColor(latestState?.inflow_m3s || 0, { warning: 10, critical: 5 })} className="ml-2 text-xs">
                {latestState?.inflow_m3s >= 10 ? 'Normal' : latestState?.inflow_m3s >= 5 ? 'Bajo' : 'Crítico'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel Embalse</CardTitle>
            <Droplets className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestState?.reservoir_level_m?.toFixed(1) || '0.0'}</div>
            <p className="text-xs text-muted-foreground">metros</p>
            <Progress 
              value={(latestState?.reservoir_level_m || 0) / 100 * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('hydro.generation')}</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestState?.turbine_mw?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">MW</p>
            <div className="flex items-center mt-2">
              <Battery className="h-3 w-3 mr-1" />
              <span className="text-xs">{latestState?.energy_mwh?.toFixed(1) || '0.0'} MWh hoy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <Gauge className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestState ? Math.round((latestState.turbine_mw / (latestState.inflow_m3s * 0.1)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Turbina-Caudal</p>
            <Progress 
              value={latestState ? (latestState.turbine_mw / (latestState.inflow_m3s * 0.1)) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts and Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monitoreo en Tiempo Real (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hydro" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hydro">Caudales</TabsTrigger>
                <TabsTrigger value="power">Generación</TabsTrigger>
                <TabsTrigger value="level">Nivel</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hydro" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="inflow" stroke="hsl(var(--primary))" strokeWidth={2} name="Entrada m³/s" />
                    <Line type="monotone" dataKey="outflow" stroke="hsl(var(--secondary))" strokeWidth={2} name="Salida m³/s" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="power" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="generation" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="MW" />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="level" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="level" stroke="hsl(var(--accent))" strokeWidth={2} name="Nivel (m)" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulación de Escenarios</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ajusta los parámetros y simula condiciones climáticas
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sequía - Severidad: {Math.round(droughtSeverity[0] * 100)}%</label>
                <Slider
                  value={droughtSeverity}
                  onValueChange={setDroughtSeverity}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
                <Button 
                  onClick={() => handleSimulation('sequia')}
                  disabled={isSimulating}
                  className="w-full mt-2"
                  variant="outline"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  {t('simulate.drought')}
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Lluvia - Severidad: {Math.round(rainSeverity[0] * 100)}%</label>
                <Slider
                  value={rainSeverity}
                  onValueChange={setRainSeverity}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
                <Button 
                  onClick={() => handleSimulation('lluvia')}
                  disabled={isSimulating}
                  className="w-full mt-2"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('simulate.rain')}
                </Button>
              </div>
            </div>

            {isSimulating && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ejecutando simulación... Los datos se actualizarán automáticamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecast */}
      {forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('hydro.forecast')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Predicciones basadas en modelos meteorológicos e hidrológicos
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="inflow" stroke="hsl(var(--primary))" strokeWidth={2} name="Caudal Pred. m³/s" />
                <Line type="monotone" dataKey="energy" stroke="hsl(var(--accent))" strokeWidth={2} name="Energía Pred. MWh" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;