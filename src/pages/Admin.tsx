import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, Users, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const seedDemoData = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke('gemelo_simulate', {
        body: { scenario: 'lluvia', severity: 0.3, days: 1 }
      });

      toast({
        title: "✅ Datos demo cargados",
        description: "El sistema ahora tiene datos operativos",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los datos demo",
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
          <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
          <p className="text-muted-foreground">Gestión del sistema</p>
        </div>
        <Badge variant="secondary">
          <Settings className="mr-2 h-3 w-3" />Admin Panel
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                <Database className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Operativo</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={seedDemoData} disabled={loading} className="w-full">
                {loading ? "Cargando..." : "Cargar Datos Demo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;