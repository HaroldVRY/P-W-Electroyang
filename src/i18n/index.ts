import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      sensors: 'Sensores',
      energred: 'EnerRed',
      community: 'Comunidad',
      kiosk: 'Kiosco',
      chat: 'Chat',
      admin: 'Admin',
      settings: 'Configuración',
      
      // Dashboard
      'hydro.inflow': 'Caudal de Entrada',
      'hydro.outflow': 'Caudal de Salida',
      'hydro.level': 'Nivel del Embalse',
      'hydro.generation': 'Generación',
      'hydro.forecast': 'Pronóstico 7 días',
      'simulate.drought': 'Simular Sequía',
      'simulate.rain': 'Simular Lluvia',
      'simulate.days': 'Simular 7 días',
      
      // Sensors
      'sensors.title': 'Sensores de Emisiones',
      'sensors.simulate': 'Simular Pico',
      'sensors.normal': 'Normal',
      'sensors.warning': 'Advertencia',
      'sensors.critical': 'Crítico',
      
      // EnerRed
      'wallet.balance': 'Mi Saldo',
      'wallet.transfer': 'Transferir',
      'wallet.history': 'Historial',
      'credits.unit': 'créditos',
      
      // Common
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      online: 'En línea',
      offline: 'Sin conexión'
    }
  },
  qu: {
    translation: {
      // Basic Quechua translations
      dashboard: 'Qhawarisqa',
      sensors: 'Musyayninakuna',
      energred: 'Kallpa Llika',
      community: 'Ayllu',
      kiosk: 'Kiosco',
      chat: 'Rimanakuy',
      admin: 'Kamachiq',
      settings: 'Allichay',
      
      'hydro.inflow': 'Yaykuq Yaku',
      'hydro.generation': 'Kallpa Ruray',
      'simulate.drought': 'Chakiy Ruwanakuy',
      'simulate.rain': 'Para Ruwanakuy',
      
      'wallet.balance': 'Qolqey',
      'credits.unit': 'créditos',
      
      save: 'Waqaychay',
      cancel: 'Saqiy',
      loading: 'Cargaspa...',
      online: 'Tinkisqa',
      offline: 'Mana tinkisqa'
    }
  },
  ay: {
    translation: {
      // Basic Aymara translations
      dashboard: 'Uñjtasiri',
      sensors: 'Musirinaaka',
      energred: 'Ch\'ama Red',
      community: 'Marka',
      kiosk: 'Kiosco',
      chat: 'Aruskipt\'añäni',
      admin: 'Irpiri',
      settings: 'Wakichaña',
      
      'hydro.inflow': 'Mantañ Uma',
      'hydro.generation': 'Ch\'ama Lurañ',
      'simulate.drought': 'Ch\'aki Lurayañ',
      'simulate.rain': 'Jallu Lurayañ',
      
      'wallet.balance': 'Qhispiyiri',
      'credits.unit': 'créditos',
      
      save: 'Imaña',
      cancel: 'Jaytañ',
      loading: 'Apayasisa...',
      online: 'Mayacht\'ata',
      offline: 'Janiw mayacht\'atäki'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;