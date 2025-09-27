import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Battery, Wifi, WifiOff } from 'lucide-react';

const Kiosk = () => {
  const isOnline = navigator.onLine;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kiosco</h1>
          <p className="text-muted-foreground">
            Punto de canje de créditos energéticos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Badge variant="secondary">
              <Wifi className="mr-2 h-3 w-3" />
              En línea
            </Badge>
          ) : (
            <Badge variant="outline">
              <WifiOff className="mr-2 h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">
              Powerbanks disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canjes Hoy</CardTitle>
            <Battery className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Transacciones completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cola Sync</CardTitle>
            <WifiOff className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Transacciones pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Productos Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Battery className="h-8 w-8 text-primary" />
                <h4 className="font-semibold">Powerbank 10,000mAh</h4>
                <p className="text-sm text-muted-foreground">
                  Batería portátil de alta capacidad
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">50 créditos</Badge>
                  <Button size="sm">Canjear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Battery className="h-8 w-8 text-primary" />
                <h4 className="font-semibold">Powerbank 5,000mAh</h4>
                <p className="text-sm text-muted-foreground">
                  Batería portátil compacta
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">25 créditos</Badge>
                  <Button size="sm">Canjear</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Kiosk;