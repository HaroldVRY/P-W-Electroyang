import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Users, TrendingUp, Send, History, Coins } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

const EnerRed = () => {
  const { wallet, transactions, loading: walletLoading, transferCredits, redeemAtKiosk } = useWallet();
  const { profiles } = useCommunityData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, addOperation } = useOfflineStorage();
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [activeTab, setActiveTab] = useState('wallet');

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0 || amount > (wallet?.balance_credits || 0)) {
      toast({
        title: "Error",
        description: "Monto inválido o saldo insuficiente",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isOnline) {
        // Store offline
        addOperation('wallet_transfer', {
          to_user_id: transferTo,
          credits: amount
        });
        toast({
          title: "💾 Guardado offline",
          description: "La transferencia se procesará cuando tengas conexión",
        });
      } else {
        await transferCredits(transferTo, amount);
        toast({
          title: "✅ Transferencia exitosa",
          description: `Se enviaron ${amount} créditos`,
        });
      }
      
      setTransferAmount('');
      setTransferTo('');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la transferencia",
        variant: "destructive",
      });
    }
  };

  const handleRedeem = async () => {
    if (!redeemAmount || !selectedKiosk) {
      toast({
        title: "Error",
        description: "Por favor selecciona un kiosco y monto",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(redeemAmount);
    if (amount <= 0 || amount > (wallet?.balance_credits || 0)) {
      toast({
        title: "Error",
        description: "Monto inválido o saldo insuficiente",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isOnline) {
        // Store offline
        addOperation('kiosk_redemption', {
          kiosk_id: selectedKiosk,
          credits: amount
        });
        toast({
          title: "💾 Guardado offline",
          description: "El canje se procesará cuando tengas conexión",
        });
      } else {
        await redeemAtKiosk(selectedKiosk, amount);
        toast({
          title: "✅ Canje exitoso",
          description: `Se canjearon ${amount} créditos`,
        });
      }
      
      setRedeemAmount('');
      setSelectedKiosk('');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar el canje",
        variant: "destructive",
      });
    }
  };

  const eligibleRecipients = profiles.filter(p => p.user_id !== user?.id);

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EnerRed</h1>
          <p className="text-muted-foreground">
            Red de energía comunitaria y créditos energéticos
          </p>
        </div>
        {!isOnline && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Sin conexión - Modo offline
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Saldo</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.balance_credits || 0} créditos</div>
            <p className="text-xs text-muted-foreground">
              Actualizado {new Date(wallet?.updated_at || '').toLocaleString('es-ES')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios en la red
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Transacciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet">
            <Coins className="mr-2 h-4 w-4" />
            Mi Wallet
          </TabsTrigger>
          <TabsTrigger value="transfer">
            <Send className="mr-2 h-4 w-4" />
            Transferir
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transferir Créditos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-to">Destinatario</Label>
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleRecipients.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.display_name} ({profile.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-amount">Monto</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    max={wallet?.balance_credits || 0}
                  />
                </div>
                <Button onClick={handleTransfer} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Créditos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canjear en Kiosco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiosco</Label>
                  <Select value={selectedKiosk} onValueChange={setSelectedKiosk}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar kiosco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kiosk-1">Kiosco Centro</SelectItem>
                      <SelectItem value="kiosk-2">Kiosco Norte</SelectItem>
                      <SelectItem value="kiosk-3">Kiosco Sur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Créditos a canjear</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    max={wallet?.balance_credits || 0}
                  />
                </div>
                <Button onClick={handleRedeem} className="w-full">
                  <Coins className="mr-2 h-4 w-4" />
                  Canjear Ahora
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Transferencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Para</Label>
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleRecipients.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.display_name} - {profile.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleTransfer} className="w-full">
                Realizar Transferencia
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay transacciones aún
                  </p>
                ) : (
                  transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {tx.from_user === user?.id ? 'Enviado' : 'Recibido'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.ts || '').toLocaleString('es-ES')}
                        </p>
                        {tx.source && (
                          <Badge variant="secondary" className="text-xs">
                            {tx.source}
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        variant={tx.from_user === user?.id ? 'destructive' : 'default'}
                      >
                        {tx.from_user === user?.id ? '-' : '+'}{tx.credits}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnerRed;