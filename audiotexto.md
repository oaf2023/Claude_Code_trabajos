**Teniendo Android nativo en Kotlin. Para un caso de negocio como el tuyo —audio ya grabado, máximo 1 segundo, lista de palabras objetivo y salida booleana— la jugada más sólida es un matcher offline embebido. Vosk ofrece reconocimiento offline para Android y vocabulario reconfigurable; su guía Android indica integrar la librería AAR, incorporar el modelo y adaptar el demo a tu app. En el demo oficial aparecen como dependencias com.alphacephei:vosk-android:0.3.75@aar y net.java.dev.jna:jna:5.18.1@aar. Además, Vosk publica un modelo small para español orientado a Android/iOS. ([GitHub](https://github.com/alphacep/vosk-api))

También existe el SpeechRecognizer del framework Android, pero sus métodos deben invocarse en el hilo principal y está pensado alrededor de startListening; por otro lado, la API nueva de ML Kit sí soporta micrófono o archivo de audio, pero hoy figura como 1.0.0-alpha1 y requiere API 26+. Para un audio corto -> true/false con vocabulario acotado, acá conviene más el matcher local con Vosk. ([Android Developers](https://developer.android.com/reference/android/speech/SpeechRecognizer))

### Setup mínimo

En app/build.gradle:

dependencies {

    implementation("net.java.dev.jna:jna:5.18.1@aar")

    implementation("com.alphacephei:vosk-android:0.3.75@aar")

}

Poné el modelo descomprimido en:

app/src/main/assets/model-es/

Para español, una base liviana es vosk-model-small-es-0.42. ([GitHub](https://github.com/alphacep/vosk-android-demo/blob/master/app/build.gradle?utm_source=chatgpt.com))

## Script nativo Android

/*

Nombre: ShortAudioKeywordMatcher.kt

Fecha: 2026-04-09

Utilidad: Reconocer desde un audio corto (máx. sugerido: 1 segundo) si aparece

    alguna palabra o frase objetivo y devolver únicamente true o false.

Función / API: Kotlin Android + Vosk offline embebido

Descripción:

- Recibe un archivo WAV PCM mono 16 kHz 16-bit
- Recibe una lista de palabras/frases objetivo
- Transcribe localmente
- Normaliza el texto
- Compara exacto + aproximado
- Devuelve true o false

Ejemplo de uso:

val ok = ShortAudioKeywordMatcher.match(

    context = this,

    wavFile = File(filesDir, "clip_1s.wav"),

    targetTexts = listOf("ayuda", "ayudame", "auxilio", "socorro")

)

// Resultado esperado: true o false

Conexión a API externa:

- No. Todo el procesamiento es local en el dispositivo.

*/

package com.tuapp.audio

import android.content.Context

import org.json.JSONObject

import org.vosk.Model

import org.vosk.Recognizer

import java.io.File

import java.io.FileOutputStream

import java.text.Normalizer

import kotlin.math.max

object ShortAudioKeywordMatcher {

    private const val MODEL_ASSET_DIR = "model-es"

    private const val SAMPLE_RATE = 16000.0f

    @Volatile

    private var cachedModel: Model? = null

    /**

    * Función principal.

    * Requiere WAV PCM mono 16 kHz 16-bit.

    * Devuelve true si encuentra al menos una coincidencia exacta o aproximada.

    */

    fun match(

    context: Context,

    wavFile: File,

    targetTexts: List`<String>`,

    fuzzyThreshold: Int = 88

    ): Boolean {

    require(wavFile.exists()) { "No existe el archivo de audio: ${wavFile.absolutePath}" }

    val normalizedTargets = targetTexts

    .map { normalize(it) }

    .filter { it.isNotBlank() }

    .distinct()

    if (normalizedTargets.isEmpty()) return false

    val model = getOrLoadModel(context)

    val grammarJson = buildGrammarJson(normalizedTargets)

    val recognizer = Recognizer(model, SAMPLE_RATE, grammarJson)

    try {

    val wavBytes = wavFile.readBytes()

    val pcmBytes = stripSimpleWavHeader(wavBytes)

    if (pcmBytes.isEmpty()) return false

    recognizer.acceptWaveForm(pcmBytes, pcmBytes.size)

    val finalJson = recognizer.finalResult

    val recognizedText = extractText(finalJson)

    val normalizedRecognized = normalize(recognizedText)

    return isMatch(

    recognized = normalizedRecognized,

    targets = normalizedTargets,

    fuzzyThreshold = fuzzyThreshold

    )

    } finally {

    recognizer.close()

    }

    }

    /**

    * Carga el modelo una sola vez y lo deja cacheado.

    */

    @Synchronized

    private fun getOrLoadModel(context: Context): Model {

    cachedModel?.let { return it }

    val modelDir = ensureAssetFolderCopied(

    context = context,

    assetFolder = MODEL_ASSET_DIR,

    targetDir = File(context.filesDir, MODEL_ASSET_DIR)

    )

    val model = Model(modelDir.absolutePath)

    cachedModel = model

    return model

    }

    /**

    * Copia la carpeta del modelo desde assets a filesDir si aún no existe.

    */

    private fun ensureAssetFolderCopied(

    context: Context,

    assetFolder: String,

    targetDir: File

    ): File {

    if (targetDir.exists() && targetDir.isDirectory && !targetDir.list().isNullOrEmpty()) {

    return targetDir

    }

    copyAssetRecursively(context, assetFolder, targetDir)

    return targetDir

    }

    private fun copyAssetRecursively(context: Context, assetPath: String, target: File) {

    val assets = context.assets.list(assetPath) ?: emptyArray()

    if (assets.isEmpty()) {

    target.parentFile?.mkdirs()

    context.assets.open(assetPath).use { input ->

    FileOutputStream(target).use { output ->

    input.copyTo(output)

    }

    }

    return

    }

    target.mkdirs()

    for (child in assets) {

    copyAssetRecursively(

    context = context,

    assetPath = "$assetPath/$child",

    target = File(target, child)

    )

    }

    }

    /**

    * Construye una gramática acotada.

    * Esto mejora el foco del reconocedor para comandos o palabras concretas.

    */

    private fun buildGrammarJson(targets: List`<String>`): String {

    val expanded = mutableListOf`<String>`()

    expanded.addAll(targets)

    // Variantes simples de negocio

    if ("ayuda" in targets && "ayudame" !in expanded) expanded.add("ayudame")

    if ("ayudame" in targets && "ayuda" !in expanded) expanded.add("ayuda")

    if ("auxilio" in targets && "auxiliame" !in expanded) expanded.add("auxiliame")

    if ("socorro" in targets && "socorreme" !in expanded) expanded.add("socorreme")

    return buildString {

    append("[")

    expanded.distinct().forEachIndexed { index, item ->

    if (index > 0) append(",")

    append("\"")

    append(item.replace("\"", "\\\""))

    append("\"")

    }

    append("]")

    }

    }

    private fun extractText(json: String): String {

    return try {

    JSONObject(json).optString("text", "")

    } catch (_: Exception) {

    ""

    }

    }

    /**

    * Asume WAV PCM estándar y elimina header simple de 44 bytes.

    * Para tu caso de audio de 1 segundo controlado es suficiente.

    */

    private fun stripSimpleWavHeader(bytes: ByteArray): ByteArray {

    if (bytes.size <= 44) return ByteArray(0)

    val riff = bytes.copyOfRange(0, 4).toString(Charsets.US_ASCII)

    val wave = bytes.copyOfRange(8, 12).toString(Charsets.US_ASCII)

    return if (riff == "RIFF" && wave == "WAVE") {

    bytes.copyOfRange(44, bytes.size)

    } else {

    bytes

    }

    }

    private fun normalize(text: String): String {

    val lowered = text.lowercase().trim()

    val withoutAccents = Normalizer.normalize(lowered, Normalizer.Form.NFD)

    .replace("\\p{Mn}+".toRegex(), "")

    return withoutAccents

    .replace("[^a-z0-9\\s]".toRegex(), " ")

    .replace("\\s+".toRegex(), " ")

    .trim()

    }

    private fun isMatch(

    recognized: String,

    targets: List`<String>`,

    fuzzyThreshold: Int

    ): Boolean {

    if (recognized.isBlank()) return false

    val tokens = recognized.split(" ").filter { it.isNotBlank() }

    for (target in targets) {

    // Match exacto por frase completa o token

    if (recognized == target) return true

    if (recognized.contains(target)) return true

    if (tokens.any { it == target }) return true

    // Match aproximado por frase completa

    if (similarityPercent(recognized, target) >= fuzzyThreshold) return true

    // Match aproximado por token

    if (tokens.any { similarityPercent(it, target) >= fuzzyThreshold }) return true

    }

    return false

    }

    private fun similarityPercent(a: String, b: String): Int {

    if (a.isBlank() || b.isBlank()) return 0

    val distance = levenshtein(a, b)

    val base = max(a.length, b.length).coerceAtLeast(1)

    return (((base - distance).toDouble() / base.toDouble()) * 100.0).toInt()

    }

    private fun levenshtein(a: String, b: String): Int {

    val dp = Array(a.length + 1) { IntArray(b.length + 1) }

    for (i in 0..a.length) dp[i][0] = i

    for (j in 0..b.length) dp[0][j] = j

    for (i in 1..a.length) {

    for (j in 1..b.length) {

    val cost = if (a[i - 1] == b[j - 1]) 0 else 1

    dp[i][j] = minOf(

    dp[i - 1][j] + 1,

    dp[i][j - 1] + 1,

    dp[i - 1][j - 1] + cost

    )

    }

    }

    return dp[a.length][b.length]

    }

}

## Cómo lo llamás

val detected = ShortAudioKeywordMatcher.match(

    context = this,

    wavFile = File(filesDir, "clip_1s.wav"),

    targetTexts = listOf("ayuda", "ayudame", "auxilio", "socorro"),

    fuzzyThreshold = 88

)

if (detected) {

    // Lanzar función crítica

} else {

    // No hacer nada

}

## Recomendación de operación

Para que este matcher sea robusto en producción:

* grabá el clip en WAV PCM mono 16 kHz 16-bit,
* mantené la ventana en 0.7 a 1.0 segundo,
* usá listas cortas de objetivos,
* y ajustá fuzzyThreshold entre 85 y 92 según ruido de ambiente.

## Qué te devuelve

Este script devuelve solo true o false.

* true: encontró una coincidencia exacta o aproximada con alguna palabra/frasе guardada.
* false: no encontró una coincidencia suficiente.

## Decisión técnica

Para tu roadmap, esta implementación tiene buen encaje porque deja un componente offline, desacoplado y de baja latencia. Vosk corre offline en Android y su demo oficial está pensado para embebido móvil; además, el proyecto resalta vocabulario reconfigurable y modelos pequeños, lo cual calza bien con una detección de comandos o palabras de auxilio. ([GitHub](https://github.com/alphacep/vosk-api))

El siguiente salto de madurez sería dejarte el bloque que graba automáticamente 1 segundo desde el micrófono, guarda clip_1s.wav, llama a ShortAudioKeywordMatcher.match(...) y dispara una función local apenas el resultado sea true.

Sí, se puede.

La arquitectura correcta en Android sería modo guardia + captura continua de micrófono + buffer circular + disparador por evento acústico. Para la captura continua, la API más adecuada es AudioRecord; si querés que siga activo mientras la app no está en primer plano visible, necesitás un foreground service con tipo microphone, junto con permiso RECORD_AUDIO y una notificación persistente. En Android 14+ el micrófono tiene restricciones de “while-in-use”, así que ese servicio no lo podés arrancar libremente desde background; conviene iniciarlo cuando el usuario activa el modo guardia con la app al frente. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))

El diseño operativo sería este:

1. Modo guardia activo: la app abre AudioRecord y empieza a leer PCM del micrófono en bloques cortos. AudioRecord está pensado justamente para captura de audio de bajo nivel. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))
2. Buffer circular de pre-evento: guardás continuamente los últimos 300 ms en memoria. Eso te permite recuperar audio “hacia atrás” cuando detectás el evento. Esto no es una API especial del sistema: es una estrategia de implementación sobre los bytes PCM que vas leyendo con AudioRecord. La base técnica para hacerlo es viable porque AudioRecord entrega audio por frames/buffers. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))
3. Detección del disparador: por cada bloque calculás métricas simples como RMS/energía, pico, o una lógica un poco más fina de “grito/ruido fuerte”. Si querés robustez, podés combinar:

* umbral de volumen,
* duración mínima de 100–200 ms,
* y opcionalmente AGC o preprocesado de audio. Android tiene AutomaticGainControl, aunque usarlo o no depende de si te conviene normalizar la entrada. ([Android Developers](https://developer.android.com/reference/android/media/audiofx/AutomaticGainControl?utm_source=chatgpt.com))

4. Recorte del clip: cuando se dispara el evento, armás el fragmento final con:

* 300 ms previos desde el buffer circular, y
* 1.000 ms posteriores capturados después del trigger.

Eso da un clip de 1,3 segundos totales. Si en cambio querés que el clip total dure solo 1 segundo, entonces la composición sería 300 ms previos + 700 ms posteriores. Eso ya es decisión funcional de producto. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))

5. Evaluación del clip: ese audio corto se lo pasás a tu matcher de palabras y te devuelve true o false. Ahí cerrás el circuito de negocio:

* ruido/grito fuerte detectado,
* se extrae clip,
* se corre reconocimiento,
* se compara con palabras objetivo,
* se dispara acción.

Eso es totalmente compatible con el patrón que ya veníamos armando. La parte de reconocimiento puede ser local/offline o remota; para audio corto, local tiene mucho sentido por latencia. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))

Hay dos restricciones operativas importantes:

* Permisos y UX: necesitás RECORD_AUDIO, pedir permiso en runtime y manejar el estado del micrófono. Android documenta el flujo de permisos runtime y además expone controles de privacidad del sensor micrófono. ([Android Developers](https://developer.android.com/training/permissions/requesting?utm_source=chatgpt.com))
* Background real: desde Android 12+ y especialmente Android 14+, arrancar o sostener captura de micrófono en background está mucho más regulado. El camino sano es foreground service con notificación visible, iniciado cuando el usuario activa explícitamente el modo guardia. ([Android Developers](https://developer.android.com/about/versions/12/summary?utm_source=chatgpt.com))

En síntesis, sí: modo guardia + escucha continua + trigger por volumen/grito + prebuffer de 300 ms + postbuffer de 1 s es una solución técnicamente válida en Android. La implementación recomendada es con AudioRecord, un buffer circular en memoria y un foreground service de micrófono cuando corresponda. ([Android Developers](https://developer.android.com/reference/android/media/AudioRecord?utm_source=chatgpt.com))

El siguiente paso lógico es bajar esto a un script nativo Android en Kotlin con:

* AudioRecord,
* buffer circular de 300 ms,
* detector por RMS/pico,
* y exportación automática del clip de 1,3 s para pasarlo al matcher booleano.

**
