/* ============================================================================
* Archivo         : react-native-wakeword.d.ts
* Descripción     : Shim local de tipos para el SDK react-native-wakeword.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Resolver el consumo tipado del SDK sin depender de sus fuentes TS defectuosas.
* ============================================================================ */

declare module 'react-native-wakeword' {
  export class KeyWordRNBridgeInstance {
    constructor(instanceId: string, isSticky: boolean);
    instanceId: string;
    createInstance(
      modelName: string,
      threshold: number,
      bufferCnt: number
    ): Promise<unknown>;
    setKeywordDetectionLicense(license: string): Promise<boolean>;
    startKeywordDetection(threshold: number): Promise<unknown>;
    stopKeywordDetection(): Promise<unknown>;
    destroyInstance(): Promise<unknown>;
    onKeywordDetectionEvent(
      callback: (phrase: string) => void
    ): { remove?: () => void };
  }

  export function createKeyWordRNBridgeInstance(
    instanceId: string,
    isSticky: boolean
  ): Promise<KeyWordRNBridgeInstance>;

  const useModel: unknown;
  export default useModel;
}