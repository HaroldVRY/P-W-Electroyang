import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertTriangle, CheckCircle, WifiOff, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSensorsData } from '@/hooks/useSensorsData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useToast } from '@/hooks/use-toast';

const Sensors = () => {
  const { sensors, latestReadings, historicalData, loading, error, simulatePeak, resetToNormal, getHealthStatus } = useSensorsData();
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [simulatingPeak, setSimulatingPeak] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const { toast } = useToast();

  // Real-time subscription for alerts
  useRealtimeSubscription(
    { table: 'alerts', event: 'INSERT' },
    (payload) => {
      const alert = payload.new;
      if (alert.kind === 'sensor_alert') {
        toast({
          title: "⚠️ Alerta de Sensor",
          description: alert.message,
          variant: alert.severity === 'critical' ? 'destructive' : 'default',
        });
      }
    }
  );

  const handleSimulatePeak = async () => {
    setSimulatingPeak(true);
    try {
      const result = await simulatePeak(0.9);

      if (result?.data?.ok) {
        toast({
          title: "✅ Pico simulado con éxito",
          description: `Se crearon ${result.data.alerts_created || 0} alertas`,
        });
      } else {
        throw new Error(result?.data?.error || 'Error en la simulación');
      }
    } catch (err: any) {
      console.error('Error simulating peak:', err);
      toast({
        title: "❌ Error en simulación",
        description: err.message || "No se pudo simular el pico de emisiones",
        variant: "destructive",
      });
    } finally {
      setSimulatingPeak(false);
    }
  };

  const handleResetToNormal = async () => {
    setResettingData(true);
    try {
      const result = await resetToNormal('simulation_only');

      if (result?.data?.success) {
        toast({
          title: "🔄 Datos restablecidos",
          description: `${result.data.deleted_telemetry} lecturas y ${result.data.deleted_alerts} alertas eliminadas`,
        });
      } else {
        throw new Error(result?.data?.error || 'Error en el restablecimiento');
      }
    } catch (err: any) {
      console.error('Error resetting data:', err);
      toast({
        title: "❌ Error en restablecimiento",
        description: err.message || "No se pudo restablecer los datos",
        variant: "destructive",
      });
    } finally {
      setResettingData(false);
    }
  };

  const getChartData = () => {
    if (!selectedSensor || !historicalData.length) return [];
    
    return historicalData
      .filter(d => d.sensor_id === selectedSensor)
      .slice(0, 24)
      .reverse()
      .map(d => ({
        time: new Date(d.ts).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        co2: d.co2_ppm || 0,
        nox: d.nox_ppm || 0,
        pm25: d.pm25_ug_m3 || 0,
        so2: d.so2_ppm || 0,
        no: d.no_ppm || 0,
        no2: d.no2_ppm || 0,
        co: d.co_ppm || 0,
        pm10: d.pm10_ug_m3 || 0,
        o3: d.o3_ppm || 0,
        temp: d.temp_c || 0,
        humidity: d.humidity_pct || 0
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Error al cargar datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sensores</h1>
          <p className="text-muted-foreground">
            Monitoreo de emisiones y condiciones ambientales
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleResetToNormal} 
            disabled={resettingData}
            variant="outline"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resettingData ? 'Restableciendo...' : 'Restablecer'}
          </Button>
          <Button onClick={handleSimulatePeak} disabled={simulatingPeak}>
            <Activity className="mr-2 h-4 w-4" />
            {simulatingPeak ? 'Simulando...' : 'Simular Pico'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestReadings.map((reading) => {
          const health = getHealthStatus(reading);
          const sensor = sensors.find(s => s.id === reading.sensor_id);
          
          return (
            <Card key={reading.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {sensor?.kind || 'Sensor'}
                </CardTitle>
                {health.status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {health.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {health.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reading.co2_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">CO₂</span>
                      <span className="font-medium">{reading.co2_ppm} ppm</span>
                    </div>
                  )}
                  {reading.nox_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">NOx</span>
                      <span className="font-medium">{reading.nox_ppm} ppm</span>
                    </div>
                  )}
                  {reading.pm25_ug_m3 && (
                    <div className="flex justify-between">
                      <span className="text-sm">PM2.5</span>
                      <span className="font-medium">{reading.pm25_ug_m3} μg/m³</span>
                    </div>
                  )}
                  {reading.so2_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">SO₂</span>
                      <span className="font-medium">{reading.so2_ppm} ppm</span>
                    </div>
                  )}
                  {reading.no_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">NO</span>
                      <span className="font-medium">{reading.no_ppm} ppm</span>
                    </div>
                  )}
                  {reading.no2_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">NO₂</span>
                      <span className="font-medium">{reading.no2_ppm} ppm</span>
                    </div>
                  )}
                  {reading.co_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">CO</span>
                      <span className="font-medium">{reading.co_ppm} ppm</span>
                    </div>
                  )}
                  {reading.pm10_ug_m3 && (
                    <div className="flex justify-between">
                      <span className="text-sm">PM10</span>
                      <span className="font-medium">{reading.pm10_ug_m3} μg/m³</span>
                    </div>
                  )}
                  {reading.o3_ppm && (
                    <div className="flex justify-between">
                      <span className="text-sm">O₃</span>
                      <span className="font-medium">{reading.o3_ppm} ppm</span>
                    </div>
                  )}
                  {reading.temp_c && (
                    <div className="flex justify-between">
                      <span className="text-sm">Temp</span>
                      <span className="font-medium">{reading.temp_c}°C</span>
                    </div>
                  )}
                </div>
                <Badge 
                  variant={health.status === 'good' ? 'default' : health.status === 'warning' ? 'secondary' : 'destructive'} 
                  className="mt-3"
                >
                  {health.status === 'good' ? 'Normal' : 
                   health.status === 'warning' ? 'Advertencia' : 'Crítico'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sensors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gráfico Histórico</CardTitle>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar sensor" />
                </SelectTrigger>
                <SelectContent>
                  {sensors.map((sensor) => (
                    <SelectItem key={sensor.id} value={sensor.id}>
                      {sensor.kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSensor ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="co2" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="CO₂ (ppm)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nox" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="NOx (ppm)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm25" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      name="PM2.5 (μg/m³)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="so2" 
                      stroke="#ff6b6b" 
                      strokeWidth={2}
                      name="SO₂ (ppm)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="no2" 
                      stroke="#4ecdc4" 
                      strokeWidth={2}
                      name="NO₂ (ppm)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="co" 
                      stroke="#45b7d1" 
                      strokeWidth={2}
                      name="CO (ppm)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm10" 
                      stroke="#f9ca24" 
                      strokeWidth={2}
                      name="PM10 (μg/m³)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="o3" 
                      stroke="#6c5ce7" 
                      strokeWidth={2}
                      name="O₃ (ppm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-muted-foreground">
                Selecciona un sensor para ver su gráfico histórico
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sensors;