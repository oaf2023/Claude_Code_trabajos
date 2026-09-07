# Archivo: app/(tabs)/contacts.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/(tabs)/contacts.tsx | 313 | TypeScript 5.9 / TSX (React Native + expo-router) | 9773 | Pantalla de contactos de confianza (tab Contactos) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Gestiona los contactos de confianza que reciben las alertas SOS con la ubicación del usuario. Opera sobre el hook `useContacts` (que a su vez usa `useContactsStore` y `ContactsService`): lista los contactos, muestra el estado activo/inactivo por contacto, permite activar/desactivar (con `Switch`), marcar uno como principal ("prioritario para llamada asistida"), editar (navegación a `/contacts/[id]`), eliminar (con confirmación y manejo de errores) y añadir nuevos (botón flotante que navega a `/contacts/new`). El orden de presentación prioriza los contactos activos y luego la antigüedad de alta (`addedAt`).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. Todos los manejadores están conectados con el hook `useContacts`. El archivo declara `ContactItem`, `sortContactsForDisplay` y `ContactsScreen`, con accesibilidad explícita en los controles principales.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` | Estándar | JSX | Sí |
| `react-native` (`View`, `Text`, `FlatList`, `TouchableOpacity`, `StyleSheet`, `Alert`, `Switch`, `ActivityIndicator`, `ViewStyle`) | Estándar | UI y tipos de estilo | Sí (todas) |
| `expo-router` (`router`) | Externa | Navegación a `/contacts/[id]` y `/contacts/new` | Sí |
| `../../src/hooks/useContacts` | Interna | Lista y operaciones CRUD de contactos | Sí |
| `../../src/types/Contact` (`Contact`) | Interna | Tipo de contacto | Sí |
| `../../src/utils/formatPhone` (`formatDisplayPhone`) | Interna | Formato de teléfono visible | Sí |
| `../../src/theme` (`color`, `spacing`, `borderRadius`, `shadow`) | Interna | Design system | Sí |
| `../../src/theme/Icon` | Interna | Iconos Material | Sí |
| `../../src/theme/Card` | Interna | Tarjeta por contacto | Sí |
| `../../src/theme/Button` | Interna | Botón flotante de alta | Sí |

## Componentes que dependen de este archivo

Ningún import directo: es la ruta `contacts` del grupo `(tabs)`, registrada en `app/(tabs)/_layout.tsx` (tab "Contactos"). Otras pantallas navegan a `/contacts` (p. ej. la tarjeta de contactos en `index.tsx` y el aviso "Ir a Contactos" del flujo de guardia). A su vez, esta pantalla navega a `/contacts/[id]` (edición, modal "Contacto" del layout raíz) y a `/contacts/new`. [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `contacts` | Del hook `useContacts` | Contact[] | Contactos cargados (tiempo real) | 130, 179-188, 205 |
| `loading` | Del hook `useContacts` | boolean | Estado de carga | 130, 169 |
| `orderedContacts` | `sortContactsForDisplay(contacts)` | Contact[] | Lista ordenada: activos primero, luego por `addedAt` | 131, 189 |
| `priorityContactId` | `id` del primer contacto activo o `null` | string \| null | Contacto "principal" resaltado | 132, 195 |
| Acciones del hook | `removeContact`, `toggleContact`, `prioritizeContact` | funciones | Baja, activar/desactivar y priorizar | 130, 156, 198-199 |
| Tamaño del FAB | 60x60, radio 30 | number | Botón flotante "Agregar" | Líneas 305–311 |

## Estructura (funciones / clases / tipos)

- `ContactItem({ contact, isPriority, onEdit, onDelete, onToggle, onPrioritize })` — tarjeta de contacto (líneas 32–106).
- `sortContactsForDisplay(contacts)` — orden operativo de la lista (líneas 119–127).
- `ContactsScreen(): JSX.Element` — pantalla por defecto (líneas 129–229), con manejador interno `handleDelete` (líneas 145–167).
- `styles` — hoja de estilos (líneas 231–313).
- Tipo importado: `Contact`; props de `ContactItem` tipadas en línea.

## Análisis línea por línea

**Bloque de las líneas 1–31 (cabecera e importaciones):**

```tsx
/* ============================================================================
* Archivo         : contacts.tsx
* Descripción     : Gestión visible de contactos con prioridad operativa y accesibilidad.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de contactos de confianza.
* ============================================================================ */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { Contact } from '../../src/types/Contact';
import { formatDisplayPhone } from '../../src/utils/formatPhone';
import { color, spacing, borderRadius, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Card } from '../../src/theme/Card';
import { Button } from '../../src/theme/Button';
```

**Explicación de las líneas 1–31:**

- **Líneas 1–9**: cabecera documental (versión 1.0.0; énfasis en accesibilidad y prioridad operativa).
- **Línea 11**: React (solo para JSX; no usa hooks directamente aquí).
- **Líneas 12–22**: primitivas de RN: `Switch` (activo/inactivo), `Alert` (confirmaciones), `FlatList`, `ViewStyle` (tipado de estilos combinados en `ContactItem`).
- **Líneas 23–31**: `router`, hook `useContacts`, tipo `Contact`, utilidad de formato de teléfono, tema, iconos y componentes base (`Card`, `Button`).

**Bloque de las líneas 32–106 (componente `ContactItem`):**

```tsx
function ContactItem({
  contact,
  isPriority,
  onEdit,
  onDelete,
  onToggle,
  onPrioritize,
}: {
  contact: Contact;
  isPriority: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onPrioritize: () => void;
}) {
  return (
    <Card style={[styles.contactCardRow, isPriority ? styles.contactCardPriority : undefined] as ViewStyle[]}>
      <View accessible accessibilityRole="summary"
        accessibilityLabel={`${contact.name}, ${formatDisplayPhone(contact.phone)}${
          isPriority ? ', contacto prioritario para llamada asistida' : ''
        }`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}
      >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>
          {formatDisplayPhone(contact.phone)}
        </Text>
        {isPriority ? <Text style={styles.priorityBadge}>Prioritario para llamada asistida</Text> : null}
      </View>
      <Switch
        value={contact.active}
        onValueChange={onToggle}
        accessibilityLabel={`Activar o desactivar a ${contact.name}`}
        accessibilityHint="Controla si este contacto recibe alertas reales"
        trackColor={{ false: color.border, true: color.safeLight }}
        thumbColor={contact.active ? color.safe : color.neutral400}
      />
      <TouchableOpacity
        onPress={onPrioritize}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={
          isPriority
            ? `${contact.name} ya es el contacto principal`
            : `Marcar a ${contact.name} como contacto principal`
        }
      >
        <Icon name={isPriority ? 'star' : 'star-border'} size={20} color={color.warning} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onEdit}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Editar contacto ${contact.name}`}
      >
        <Icon name="edit" size={20} color={color.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contacto ${contact.name}`}
      >
        <Icon name="delete" size={20} color={color.danger} />
      </TouchableOpacity>
    </View>
    </Card>
  );
}
```

**Explicación de las líneas 32–106:**

- **Líneas 32–46**: firma y props tipadas de `ContactItem`: el contacto, si es prioritario, y los callbacks de editar/borrar/alternar/priorizar.
- **Líneas 47–48**: tarjeta con estilo condicional (`contactCardPriority`, borde ámbar) si es prioritario.
- **Líneas 49–53**: contenedor `View` marcado `accessible` con `accessibilityRole="summary"` y una etiqueta que resume nombre, teléfono y condición de prioritario. [OBSERVACIÓN TÉCNICA] Un contenedor accesible que envuelve controles interactivos (Switch y botones) puede hacer que el lector de pantalla agrupe (o incluso oculte) los hijos interactivos según la plataforma; conviene probar con TalkBack/VoiceOver.
- **Líneas 55–59**: avatar circular con la inicial del nombre.
- **Líneas 60–65**: bloque de información: nombre, teléfono formateado (`formatDisplayPhone`) y, si es prioritario, la insignia "Prioritario para llamada asistida".
- **Líneas 67–74**: `Switch` de activo/inactivo con etiquetas de accesibilidad e hint ("Controla si este contacto recibe alertas reales"), colores según estado.
- **Líneas 75–86**: botón de prioridad (estrella rellena `star` si es principal, contorno `star-border` si no); la etiqueta de accesibilidad cambia según el estado.
- **Líneas 87–94**: botón de edición (icono `edit`) que invoca `onEdit`.
- **Líneas 95–102**: botón de eliminación (icono `delete` en rojo) que invoca `onDelete`.
- **Líneas 103–106**: cierre del contenedor, la tarjeta y el componente.

**Bloque de las líneas 108–127 (función `sortContactsForDisplay`):**

```tsx
/* ============================================================================
* Función         : sortContactsForDisplay
* Descripción     : Prioriza contactos activos manteniendo el orden operativo por alta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ContactsScreen
* Ingesta         : contacts: Contact[]
* Devolución      : Contact[]
* Uso             : const ordered = sortContactsForDisplay(contacts)
* ============================================================================ */
function sortContactsForDisplay(contacts: Contact[]): Contact[] {
  return [...contacts].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    return left.addedAt - right.addedAt;
  });
}
```

**Explicación de las líneas 108–127:**

- **Líneas 108–118**: docblock (versión 1.0.0).
- **Líneas 119–127**: copia defensiva (`[...contacts]`) y ordenación: los contactos activos van primero (`left.active ? -1 : 1`) y entre iguales ordena por `addedAt` ascendente (más antiguo primero). No muta el array del store.

**Bloque de las líneas 129–167 (pantalla: selectores y `handleDelete`):**

```tsx
export default function ContactsScreen() {
  const { contacts, loading, removeContact, toggleContact, prioritizeContact } = useContacts();
  const orderedContacts = sortContactsForDisplay(contacts);
  const priorityContactId = orderedContacts.find((contact) => contact.active)?.id ?? null;

  /* ============================================================================
  * Función         : handleDelete
  * Descripción     : Confirma y elimina un contacto mostrando errores operativos si la baja falla.
  * Fecha           : 2026-03-25
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useContacts.removeContact, Alert
  * Ingesta         : contact: Contact
  * Devolución      : void
  * Uso             : onDelete={() => handleDelete(item)}
  * ============================================================================ */
  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Eliminar contacto',
      `¿Eliminar a ${contact.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contact.id);
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar',
                error?.message || 'La baja del contacto falló. Reintenta en unos segundos.'
              );
            }
          },
        },
      ]
    );
  };
```

**Explicación de las líneas 129–167:**

- **Línea 130**: desestructura del hook `useContacts`: datos y operaciones CRUD.
- **Línea 131**: lista ordenada para presentación.
- **Línea 132**: `priorityContactId` = el primer contacto activo de la lista ordenada (el más antiguo activo), o `null`. [OBSERVACIÓN TÉCNICA] La "prioridad" visual se deriva del primer activo; no de un flag explícito en el modelo (ver más abajo sobre `prioritizeContact`).
- **Líneas 134–144**: docblock de `handleDelete`.
- **Líneas 145–167**: `handleDelete` — diálogo de confirmación "¿Eliminar a {nombre}?" con acción destructiva que llama `removeContact(contact.id)`; si falla muestra "No se pudo eliminar" con el mensaje de error del servicio.

**Bloque de las líneas 169–213 (estados de carga/vacío y lista):**

```tsx
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people" size={64} color={color.neutral400} />
          <Text style={styles.emptyTitle}>Sin contactos de confianza</Text>
          <Text style={styles.emptySub}>
            Agrega personas que recibirán tu ubicación en emergencias.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orderedContacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              isPriority={item.id === priorityContactId}
              onEdit={() => router.push(`/contacts/${item.id}`)}
              onDelete={() => handleDelete(item)}
              onToggle={(active) => toggleContact(item.id, active)}
              onPrioritize={() => prioritizeContact(item.id)}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.listHeader}>
                {contacts.filter((c) => c.active).length} de {contacts.length} contactos activos
              </Text>
              <Text style={styles.headerHint}>
                El contacto principal activo se usa como prioridad para la llamada asistida.
              </Text>
            </View>
          }
        />
      )}
```

**Explicación de las líneas 169–213:**

- **Líneas 169–175**: spinner mientras `loading`.
- **Líneas 177–178**: contenedor principal.
- **Líneas 179–186**: estado vacío con icono, "Sin contactos de confianza" y subtítulo.
- **Líneas 188–212**: `FlatList` sobre `orderedContacts`: clave por `id`; cada ítem usa `ContactItem` con:
  - `isPriority`: compara con `priorityContactId`.
  - `onEdit`: navega a `/contacts/${item.id}` (ruta dinámica modal del layout raíz).
  - `onDelete`: `handleDelete`.
  - `onToggle`: `toggleContact(id, active)`.
  - `onPrioritize`: `prioritizeContact(item.id)`.
- **Líneas 202–211**: cabecera de la lista con "N de M contactos activos" y el hint "El contacto principal activo se usa como prioridad para la llamada asistida".

**Bloque de las líneas 215–229 (botón flotante de alta):**

```tsx
      <View style={styles.fabContainer}>
        <Button
          title=""
          icon="add"
          onPress={() => router.push('/contacts/new')}
          variant="danger"
          size="lg"
          style={styles.fab}
          accessibilityLabel="Agregar nuevo contacto de confianza"
          accessibilityHint="Abre el formulario para sumar un contacto"
        />
      </View>
    </View>
  );
}
```

**Explicación de las líneas 215–229:**

- **Líneas 215–226**: contenedor del FAB posicionado en absoluto (abajo derecha) con `Button` del tema: sin título, icono `add`, variante danger, tamaño lg, estilo circular 60x60; accesibilidad con etiqueta "Agregar nuevo contacto de confianza" y hint.
- **Línea 219**: navega a `/contacts/new`. [OBSERVACIÓN TÉCNICA] No existe un archivo estático `app/contacts/new.tsx` (verificado con glob); la ruta `/contacts/new` la resuelve la ruta dinámica `app/contacts/[id].tsx` con `id = 'new'`, que presumiblemente detecta ese valor para abrir el formulario de alta. [NIVEL DE CERTEZA: Altamente probable].
- **Líneas 227–229**: cierre del contenedor y del componente.

**Bloque de las líneas 231–284 (hoja de estilos, parte 1):**

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: 16, gap: 8, paddingBottom: 80 },
  listHeader: {
    fontSize: 13,
    color: color.textSecondary,
    textAlign: 'center',
  },
  headerCard: {
    gap: 6,
    marginBottom: 12,
  },
  headerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: color.textSecondary,
  },

  contactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  contactCardPriority: {
    borderWidth: 1,
    borderColor: color.warning,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.danger,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  contactPhone: { fontSize: 13, color: color.textSecondary, marginTop: 2 },
  priorityBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: color.warning,
  },
  actionBtn: { padding: 6 },
```

**Explicación de las líneas 231–284:**

- **Líneas 231–233**: contenedor y centrado.
- **Líneas 235–250**: lista (padding inferior 80 para el FAB), cabecera centrada y hint.
- **Líneas 252–258**: tarjeta de contacto en fila; variante prioritaria con borde ámbar (`warning`).
- **Líneas 262–274**: avatar circular 44 px con inicial sobre fondo `dangerLight`.
- **Líneas 275–283**: bloque de nombre/teléfono (flex 1) e insignia de prioridad.
- **Línea 284**: `actionBtn` — padding táctil de los botones de icono.

**Bloque de las líneas 285–313 (hoja de estilos, parte 2):**

```tsx
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: color.textPrimary },
  emptySub: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

});
```

**Explicación de las líneas 285–313:**

- **Líneas 285–294**: estado vacío centrado con textos.
- **Líneas 300–311**: contenedor del FAB en posición absoluta (abajo-derecha, 24 px) y FAB circular de 60 px sin padding interno (para que el icono quede centrado).
- **Líneas 312–313**: cierre del `StyleSheet` y del archivo.

## Fichas de funciones y métodos

### ContactItem (líneas 32–106)

- Firma: `function ContactItem({ contact, isPriority, onEdit, onDelete, onToggle, onPrioritize }: {...})`
- Propósito: tarjeta operable de un contacto con controles de estado, prioridad, edición y borrado.
- Parámetros: `contact` (Contact), `isPriority` (boolean), y 4 callbacks. Retorno: JSX de `Card`.
- Dependencias: `formatDisplayPhone`, `Icon`, `Switch`, tema.
- Efectos secundarios: ninguno (componente controlado; las acciones las ejecuta el padre).
- Riesgos: accesibilidad por contenedor `accessible` envolviendo controles (ver Observaciones).

### sortContactsForDisplay (líneas 119–127)

- Firma: `function sortContactsForDisplay(contacts: Contact[]): Contact[]`
- Propósito: orden estable activos-primero y por antigüedad de alta.
- Parámetros: `contacts`. Retorno: nueva lista ordenada (sin mutar el original).
- Dependencias: ninguna externa.

### handleDelete (líneas 145–167)

- Firma: `const handleDelete = (contact: Contact) => void`
- Propósito: confirmar y eliminar un contacto con manejo visible de errores.
- Parámetros: `contact`. Retorno: `void` (asíncrono interno).
- Dependencias: `Alert`, `removeContact` del hook.
- Flujo: diálogo de confirmación → `await removeContact(contact.id)` → error capturado con alerta "No se pudo eliminar".

### ContactsScreen (líneas 129–229)

- Firma: `export default function ContactsScreen(): JSX.Element`
- Propósito: lista y operaciones de los contactos de confianza.
- Parámetros: ninguno. Retorno: spinner / lista con FAB.
- Dependencias: `useContacts`, `sortContactsForDisplay`, `router`.
- Efectos secundarios: navegación a `/contacts/[id]` y `/contacts/new`; borrado, alternancia y priorización vía hook (que persisten en Firestore a través de `ContactsService`).

## Clases / interfaces / tipos

- Tipo importado `Contact` (`src/types/Contact`) con al menos `id`, `name`, `phone`, `active`, `addedAt` (según uso).
- Props de `ContactItem` tipadas en línea (sin nombre exportado).
- Sin clases.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 132: `priorityContactId` se calcula como el primer contacto activo según el orden (activos primero + `addedAt`); no hay un campo persistente "principal" en la UI. `prioritizeContact(item.id)` (línea 199) seguramente persiste ese estado en el modelo; sin el código del hook no se puede confirmar el mecanismo exacto. [NIVEL DE CERTEZA: Altamente probable].
- [OBSERVACIÓN TÉCNICA] Línea 219: `/contacts/new` no existe como ruta estática; cae en la ruta dinámica `contacts/[id]` con `id = 'new'`. [NIVEL DE CERTEZA: Altamente probable]. Impacto: si la pantalla `[id]` no distingue `'new'`, un alta podría intentar editar un contacto inexistente.
- [OBSERVACIÓN TÉCNICA] Líneas 49–53: el contenedor accesible (`accessibilityRole="summary"`) envuelve el `Switch` y los tres botones; dependiendo de la plataforma puede agrupar los hijos en un único foco o, peor, ocultarlos al lector de pantalla. [NIVEL DE CERTEZA: Inferido]. Conviene probar con TalkBack y VoiceOver.
- [OBSERVACIÓN TÉCNICA] En la lista no se distingue visualmente un contacto inactivo salvo por el estado del `Switch` (sin opacidad/estilo atenuado); el contraste de "recibe/recibirá alertas" depende del control.
- [NOTA] Los teléfonos se muestran formateados (`formatDisplayPhone`), mitigando exposición accidental de formato crudo; aun así, son datos personales visibles en pantalla (ver Seguridad).

## Seguridad

- [MEDIO] Los contactos contienen nombres y teléfonos (PII) y se gestionan desde el cliente con `userId` local como contexto (vía `useContacts`/`ContactsService`). [NIVEL DE CERTEZA: Confirmado por código para la UI]. La protección depende de las reglas Firestore sobre `users/{uid}/contacts` y del flujo de sesión (ver riesgos del layout raíz). 
- [INFORMATIVO] El borrado solicita confirmación (evita destrucción accidental), pero no hay autenticación reforzada para operaciones sensibles.
- [INFORMATIVO] Sin secretos ni tokens en el archivo; los errores de borrado se muestran en pantalla (mensaje del servicio) sin datos de autenticación.
- [INFORMATIVO] Sin SQL, rutas dinámicas de archivos ni HTML en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Revisar la estructura de accesibilidad de `ContactItem`: aplicar `accessible={false}` al contenedor y dejar foco individual a cada control, o usar `accessibilityRole="summary"` solo si la plataforma lo gestiona correctamente.
- [RIESGO] [RECOMENDACIÓN] Confirmar que `app/contacts/[id].tsx` maneja el caso `id === 'new'` para el alta; en caso contrario crear una ruta estática `/contacts/new`.
- [RECOMENDACIÓN] Aclarar el modelo de "contacto principal": si la prioridad se persiste, usar el flag almacenado para derivar `priorityContactId` en lugar de "primer activo".
- [RECOMENDACIÓN] Verificar reglas Firestore restrictivas (solo el propietario) para `users/{uid}/contacts`.
