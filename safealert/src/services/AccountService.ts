/* ============================================================================
* Archivo         : AccountService.ts
* Descripción     : Servicio de cuenta recuperable. Permite migrar de identidad
*                   anónima a credenciales recuperables (email + contraseña).
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AccountService.linkEmail(email, password)
* ============================================================================ */

import { Platform } from 'react-native';

function getAuth(): any {
  if (Platform.OS === 'android') {
    return require('@react-native-firebase/auth').default();
  }
  return null;
}

export const AccountService = {
  async getCurrentUser(): Promise<{ uid: string; isAnonymous: boolean; email: string | null } | null> {
    const auth = getAuth();
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;
    return { uid: user.uid, isAnonymous: user.isAnonymous, email: user.email || null };
  },

  async linkEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      const user = auth?.currentUser;
      if (!user) return { success: false, message: 'No hay sesión activa.' };
      if (!user.isAnonymous) return { success: false, message: 'La cuenta ya tiene credenciales.' };

      const { EmailAuthProvider } = require('@react-native-firebase/auth');
      const credential = EmailAuthProvider.credential(email, password);
      await user.linkWithCredential(credential);
      console.log('[Account] Cuenta vinculada con email:', email);
      return { success: true, message: 'Cuenta vinculada correctamente.' };
    } catch (error: any) {
      const msg = error?.code === 'auth/email-already-in-use'
        ? 'Este email ya está registrado. Iniciá sesión en lugar de vincular.'
        : error?.message || 'Error al vincular cuenta.';
      console.error('[Account] Error al vincular:', error?.code, msg);
      return { success: false, message: msg };
    }
  },

  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      if (!auth) return { success: false, message: 'Autenticación no disponible.' };
      await auth.signInWithEmailAndPassword(email, password);
      console.log('[Account] Inicio de sesión exitoso:', email);
      return { success: true, message: 'Sesión iniciada.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al iniciar sesión.' };
    }
  },

  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      if (!auth) return { success: false, message: 'Autenticación no disponible.' };
      await auth.sendPasswordResetEmail(email);
      console.log('[Account] Email de restablecimiento enviado a:', email);
      return { success: true, message: 'Revisá tu correo para restablecer la contraseña.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al enviar email.' };
    }
  },

  async signOut(): Promise<void> {
    const auth = getAuth();
    if (auth) {
      await auth.signOut();
      console.log('[Account] Sesión cerrada.');
    }
  },
};
