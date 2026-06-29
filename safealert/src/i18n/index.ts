/* ============================================================================
* Archivo         : index.ts
* Descripción     : Núcleo de internacionalización con detección automática
*                   de idioma y store persistente (Fase 5).
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { t, useI18n } from '../i18n';
* ============================================================================ */

import { useCallback, useSyncExternalStore } from 'react';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { es } from './es';
import { en } from './en';
import type { Translations } from './types';

export type SupportedLocale = 'es' | 'en';

const STORAGE_KEY = '@safealert/locale';
const FALLBACK_LOCALE: SupportedLocale = 'es';

const translations: Record<SupportedLocale, Translations> = { es, en };

let currentLocale: SupportedLocale = getDefaultLocale();

function getDefaultLocale(): SupportedLocale {
  try {
    const locales = getLocales();
    const primary = locales[0]?.languageCode;
    if (primary === 'en') return 'en';
  } catch {}
  return FALLBACK_LOCALE;
}

let listeners: Set<() => void> = new Set();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): SupportedLocale {
  return currentLocale;
}

export async function setLocale(locale: SupportedLocale): Promise<void> {
  currentLocale = locale;
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  listeners.forEach((cb) => cb());
}

export async function loadSavedLocale(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') {
      currentLocale = saved;
      listeners.forEach((cb) => cb());
    }
  } catch {}
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

export function t<K extends keyof Translations>(key: K): Translations[K];
export function t(path: string): string;
export function t(path: string): string {
  const keys = path.split('.');
  let result: unknown = translations[currentLocale];
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      result = undefined;
      break;
    }
  }
  if (typeof result === 'string') return result;
  return path;
}

export function tpl(template: string, vars: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const _t = useCallback((path: string, vars?: Record<string, string | number>): string => {
    const value = t(path);
    if (vars) return tpl(value, vars);
    return value;
  }, [locale]);

  return { locale, t: _t, setLocale, translations: translations[locale] };
}
