/* ============================================================================
* Archivo         : como-funciona.tsx
* Descripción     : Pantalla informativa "Cómo Funciona SafeAlert" con guía
*                   paso a paso del flujo operativo de la aplicación.
* Autor           : oafon
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Navegación desde Ajustes via router.push('/como-funciona')
* ============================================================================ */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../src/config/constants';

interface PasoProps {
  numero: string;
  titulo: string;
  detalle: string;
}

/* ============================================================================
* Función         : Paso
* Descripción     : Renderiza un paso de la guía con ícono numerado y descripción.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ComoFuncionaScreen
* Ingesta         : numero, titulo, detalle
* Devolución      : JSX.Element
* Uso             : <Paso numero="1" titulo="..." detalle="..." />
* ============================================================================ */
function Paso({ numero, titulo, detalle }: PasoProps) {
  return (
    <View style={styles.paso}>
      <View style={styles.pasoNumero}>
        <Text style={styles.pasoNumeroText}>{numero}</Text>
      </View>
      <View style={styles.pasoContenido}>
        <Text style={styles.pasoTitulo}>{titulo}</Text>
        <Text style={styles.pasoDetalle}>{detalle}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
* Función         : ComoFuncionaScreen
* Descripción     : Pantalla con guía completa de uso de SafeAlert organizada
*                   en pasos numerados y secciones temáticas.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : _layout.tsx (Stack.Screen), settings.tsx
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Accesible desde Ajustes → "Cómo Funciona"
* ============================================================================ */
export default function ComoFuncionaScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🛡️</Text>
        <Text style={styles.headerTitle}>Cómo Funciona SafeAlert</Text>
        <Text style={styles.headerSub}>
          Tu escudo de emergencia personal. Fácil, rápido y silencioso.
        </Text>
      </View>

      {/* Sección: Primeros pasos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Primeros pasos</Text>

        <Paso
          numero="1"
          titulo="Agregá tus contactos de confianza"
          detalle='Andá a la pestaña "Contactos" y agregá al menos una persona de confianza con su nombre y teléfono. Esta persona recibirá las alertas de emergencia.'
        />

        <Paso
          numero="2"
          titulo="Verificá los permisos"
          detalle='SafeAlert necesita acceso al micrófono, ubicación y notificaciones. Andá a "Ajustes → Ver estado de permisos" y asegurate de que todos estén activos.'
        />

        <Paso
          numero="3"
          titulo="Activá el modo guardia"
          detalle='En la pantalla principal, presioná el botón grande "ACTIVAR GUARDIA". El escudo quedará encendido y la app comenzará a escuchar palabras de activación.'
        />
      </View>

      {/* Sección: Durante una emergencia */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Durante una emergencia</Text>

        <Paso
          numero="4"
          titulo="Activación por voz"
          detalle='Di en voz alta las palabras configuradas (como "socorro", "ayuda" o tu propia palabra clave). SafeAlert las detectará aunque estés en una conversación.'
        />

        <Paso
          numero="5"
          titulo="Botón SOS manual"
          detalle='Si preferís, presioná el botón grande en la pantalla principal. Tenés unos segundos para cancelar si fue accidental antes de que se envíe la alerta.'
        />

        <Paso
          numero="6"
          titulo="SafeAlert envía la alerta"
          detalle='Automáticamente se envía un mensaje WhatsApp con tu ubicación GPS, la hora y tu mensaje de emergencia a todos tus contactos activos. Si configuraste audio, también se graba un clip de voz.'
        />
      </View>

      {/* Sección: Funciones avanzadas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Funciones avanzadas</Text>

        <Paso
          numero="🔑"
          titulo="Palabras de activación personalizadas"
          detalle='Podés agregar tus propias palabras en "Ajustes → Activación por voz". El modelo de voz español escucha continuamente cuando la guardia está activa.'
        />

        <Paso
          numero="📍"
          titulo="Ubicación en tiempo real"
          detalle='Tu ubicación GPS se adjunta automáticamente a cada alerta. Cuanto más precisa sea la señal GPS, más rápido podrán encontrarte.'
        />

        <Paso
          numero="🎙️"
          titulo="Grabación de audio de 60 segundos"
          detalle='Cuando se activa la alerta, SafeAlert graba 60 segundos del entorno y los sube al servidor seguro. Tus contactos pueden solicitar el audio si es necesario.'
        />

        <Paso
          numero="🔔"
          titulo="Recordatorios diarios"
          detalle='Activá los recordatorios desde Ajustes para recibir una notificación diaria que te recuerde revisar que la guardia esté activa y los contactos actualizados.'
        />
      </View>

      {/* Sección: Período de prueba */}
      <View style={[styles.seccion, styles.seccionDestacada]}>
        <Text style={styles.seccionTitulo}>Período de prueba gratuita</Text>
        <Text style={styles.seccionCuerpo}>
          Desde que cargás tu primer contacto de emergencia, comenzás a disfrutar
          de <Text style={styles.bold}>10 días gratis</Text> con todas las funciones
          habilitadas.{'\n\n'}
          Al finalizar el período, podés suscribirte para continuar protegiendo
          a los tuyos sin interrupciones.
        </Text>
      </View>

      {/* Sección: Consejos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Consejos de uso</Text>
        <Text style={styles.consejo}>💡 Cargá siempre el teléfono antes de salir solo/a.</Text>
        <Text style={styles.consejo}>💡 Informale a tus contactos que los agregaste para que reconozcan los mensajes.</Text>
        <Text style={styles.consejo}>💡 Activá la guardia cuando estés en situaciones de riesgo o lugares desconocidos.</Text>
        <Text style={styles.consejo}>💡 Practicá una alerta de prueba con un contacto de confianza para verificar que funciona.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SafeAlert — Versión MVP · Tu seguridad, siempre.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 19,
  },

  seccion: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  seccionDestacada: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  seccionCuerpo: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.danger,
  },

  paso: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pasoNumero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pasoNumeroText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  pasoContenido: {
    flex: 1,
    gap: 4,
  },
  pasoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  pasoDetalle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },

  consejo: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
