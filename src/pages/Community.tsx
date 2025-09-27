import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MessageCircle, Award, Search, Filter, Zap } from 'lucide-react';
import { useCommunityData } from '@/hooks/useCommunityData';

const Community = () => {
  const { profiles, stats, loading } = useCommunityData();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('credits');

  const filteredProfiles = profiles
    .filter(profile => {
      const matchesSearch = profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'credits':
          return (b.credits || 0) - (a.credits || 0);
        case 'generators':
          return (b.generators_count || 0) - (a.generators_count || 0);
        case 'name':
          return (a.display_name || '').localeCompare(b.display_name || '');
        default:
          return 0;
      }
    });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'operator':
        return 'bg-blue-100 text-blue-800';
      case 'generator':
        return 'bg-green-100 text-green-800';
      case 'consumer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'generator':
        return <Zap className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Comunidad</h1>
          <p className="text-muted-foreground">
            Conecta con otros miembros de la red energética
          </p>
        </div>
        <Button>
          <MessageCircle className="mr-2 h-4 w-4" />
          Nuevo Mensaje
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros Totales</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generadores Activos</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGenerators}</div>
            <p className="text-xs text-muted-foreground">
              Con sistemas instalados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Generador</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.topGenerator?.display_name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.topGenerator?.credits || 0} créditos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="operator">Operadores</SelectItem>
                <SelectItem value="generator">Generadores</SelectItem>
                <SelectItem value="consumer">Consumidores</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credits">Por créditos</SelectItem>
                <SelectItem value="generators">Por generadores</SelectItem>
                <SelectItem value="name">Por nombre</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              Mostrando {filteredProfiles.length} de {profiles.length} miembros
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron miembros</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <Card key={profile.user_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {profile.display_name?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold text-lg leading-none">
                        {profile.display_name || 'Usuario Anónimo'}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`mt-2 text-xs ${getRoleColor(profile.role)}`}
                      >
                        {getRoleIcon(profile.role)}
                        <span className="ml-1 capitalize">{profile.role}</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Créditos:</span>
                        <Badge variant="outline" className="font-medium">
                          {profile.credits || 0}
                        </Badge>
                      </div>
                      
                      {profile.generators_count && profile.generators_count > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Generadores:</span>
                          <Badge variant="secondary" className="font-medium">
                            <Zap className="h-3 w-3 mr-1" />
                            {profile.generators_count}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="w-full mt-3">
                      <MessageCircle className="mr-2 h-3 w-3" />
                      Contactar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Top Contributors */}
      {filteredProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Principales Contribuyentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProfiles
                .filter(p => (p.credits || 0) > 0)
                .slice(0, 5)
                .map((profile, index) => (
                  <div key={profile.user_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {profile.display_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{profile.display_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {profile.credits} créditos
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Community;