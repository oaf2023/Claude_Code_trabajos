/* ============================================================================
* Archivo         : AccesoRegistroService.ts
* Descripción     : Servicio para registrar accesos técnicos y metadatos
*                   del dispositivo según Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import { Platform, Dimensions } from 'react-native';
import * as Localization from 'expo-localization';
import { LocationApiClient } from './LocationApiClient';
import { AccesoPayload } from '../types/Location';

function detectarDispositivo(): string {
  const platform = Platform.OS;
  const isTablet =
    (Platform as { isPad?: boolean }).isPad === true ||
    (Platform.OS === 'android' &&
      (Platform.constants as { isTablet?: boolean })?.isTablet === true);
  if (isTablet) return 'tablet';
  return platform === 'android' ? 'telefono' : platform === 'ios' ? 'telefono' : 'desktop';
}

function detectarNavegador(): string {
  const ua = Platform.constants?.reactNativeVersion
    ? `React Native ${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}`
    : 'React Native';
  return ua;
}

export const AccesoRegistroService = {
  async registrarAccesoInicial(userId?: string, sesionId?: string): Promise<void> {
    const { width: ventanaAncho, height: ventanaAlto } = Dimensions.get('window');
    const { width: pantallaAncho, height: pantallaAlto } = Dimensions.get('screen');

    const payload: AccesoPayload = {
      usuario_id: userId,
      sesion_id: sesionId,
      device_id_app: sesionId,
      pagina_consultada: 'app',
      navegador_aproximado: detectarNavegador(),
      sistema_operativo_aproximado: `${Platform.OS} ${Platform.Version}`,
      tipo_dispositivo: detectarDispositivo(),
      idioma: Localization.getLocales()?.[0]?.languageTag || 'es',
      zona_horaria: Localization.getCalendars()?.[0]?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset_utc_minutos: new Date().getTimezoneOffset(),
      pantalla_ancho: pantallaAncho,
      pantalla_alto: pantallaAlto,
      ventana_ancho: ventanaAncho,
      ventana_alto: ventanaAlto,
      profundidad_color: 24,
      metodo_autenticacion: userId ? 'firebase_anonimo' : 'no_autenticado',
    };

    /* No bloqueante: enviar en segundo plano */
    LocationApiClient.registrarAcceso(payload).catch(() => {});
  },
};
