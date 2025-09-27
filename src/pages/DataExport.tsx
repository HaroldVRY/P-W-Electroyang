import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Database, Calendar, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const DataExport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    table: 'telemetry',
    startDate: '',
    endDate: '',
    format: 'csv'
  });

  const availableExports = [
    {
      id: 'telemetry',
      name: 'Datos de Sensores',
      description: 'Lecturas de sensores ambientales (CO₂, NOx, PM2.5, temperatura, humedad)',
      table: 'telemetry'
    },
    {
      id: 'hydro_state',
      name: 'Estado Hidroeléctrico',
      description: 'Datos del gemelo digital hidroeléctrico (caudal, nivel, turbinas)',
      table: 'hydro_state'
    },
    {
      id: 'forecasts',
      name: 'Pronósticos',
      description: 'Predicciones de generación y caudal',
      table: 'forecasts'
    },
    {
      id: 'transactions',
      name: 'Transacciones',
      description: 'Historial de transferencias de créditos energéticos',
      table: 'transactions'
    },
    {
      id: 'kiosk_redemptions',
      name: 'Canjes de Kiosco',
      description: 'Registro de canjes realizados en kioscos',
      table: 'kiosk_redemptions'
    },
    {
      id: 'excedentes',
      name: 'Excedentes de Energía',
      description: 'Datos de generación y excedentes por generador',
      table: 'excedentes'
    },
    {
      id: 'alerts',
      name: 'Alertas del Sistema',
      description: 'Historial de alertas ambientales y del sistema',
      table: 'alerts'
    }
  ];

  const handleExport = async (exportType: string) => {
    setLoading(true);
    try {
      // Direct query for specific table
      const { data, error } = await supabase
        .from(exportType as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay datos disponibles para exportar en el rango seleccionado",
          variant: "destructive",
        });
        return;
      }

      // Convert to CSV
      const csv = convertToCSV(data);
      downloadCSV(csv, `${exportType}_${new Date().toISOString().split('T')[0]}.csv`);

      toast({
        title: "✅ Exportación exitosa",
        description: `Se han exportado ${data.length} registros`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo completar la exportación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickExport = async (table: string) => {
    setLoading(true);
    try {
      // Direct query for specific table
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay datos disponibles para exportar",
          variant: "destructive",
        });
        return;
      }

      const csv = convertToCSV(data);
      downloadCSV(csv, `${table}_export_${new Date().toISOString().split('T')[0]}.csv`);

      toast({
        title: "✅ Exportación exitosa",
        description: `Se han exportado ${data.length} registros de ${table}`,
      });
    } catch (error) {
      console.error('Quick export error:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo completar la exportación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exportar Datos</h1>
          <p className="text-muted-foreground">
            Descarga datasets y reportes del sistema en formato CSV
          </p>
        </div>
        <Database className="h-8 w-8 text-primary" />
      </div>

      {/* Quick Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Exportaciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableExports.map((exportOption) => (
              <Card key={exportOption.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{exportOption.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exportOption.description}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleQuickExport(exportOption.table)}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Descargar CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Exportación Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tabla de datos</Label>
              <Select 
                value={exportConfig.table} 
                onValueChange={(value) => setExportConfig({ ...exportConfig, table: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableExports.map((option) => (
                    <SelectItem key={option.table} value={option.table}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select 
                value={exportConfig.format} 
                onValueChange={(value) => setExportConfig({ ...exportConfig, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json" disabled>JSON (Próximamente)</SelectItem>
                  <SelectItem value="xlsx" disabled>Excel (Próximamente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={exportConfig.startDate}
                onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={exportConfig.endDate}
                onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
              />
            </div>
          </div>

          <Button 
            onClick={() => handleExport(exportConfig.table)} 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Exportar Datos Personalizados
          </Button>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre Exportaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Formatos Disponibles</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• CSV: Formato estándar para análisis de datos</li>
                <li>• Compatible con Excel, Google Sheets, Python, R</li>
                <li>• Separadores: comas, codificación UTF-8</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Limitaciones</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Máximo 10,000 registros por exportación</li>
                <li>• Datos disponibles desde la fecha de creación</li>
                <li>• Exportaciones rápidas: últimos 7 días para series temporales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExport;