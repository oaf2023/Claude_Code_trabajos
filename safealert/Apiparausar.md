Tengo una API creada por mi que traduce audio a texto, quiero incorporarla para activar la guardia de voz que el sistema tiene.

Perfecto. Desde un software nativo móvil la API se llama como una petición HTTP POST multipart/form-data.

Tu app móvil hace este circuito:

graba o selecciona un audio → arma la petición HTTP → envía el archivo a oaf.pythonanywhere.com → recibe un JSON → compara el resultado → decide si dispara una alerta o no

---

# 1) Endpoint que debe llamar el móvil

La URL operativa sería:

https://oaf.pythonanywhere.com/api/audio/detectar-alerta

También podés usar el alias:

https://oaf.pythonanywhere.com/api/audio/transcribir

Pero para tu caso de negocio conviene el primero.

---

# 2) Qué debe enviar el móvil

La app nativa debe enviar:

### Método

POST

### Headers

X-API-Key: TU_CLAVE_PRIVADA

### Body

Tipo:

multipart/form-data

Campos:

* archivo → el audio grabado o seleccionado
* language → es
* threshold → por ejemplo 82

---

# 3) Qué devuelve la API al móvil

La API devuelve un JSON.

## Ejemplo de salida exitosa

{

  "ok": true,

  "archivo_original": "alerta.mp3",

  "idioma_detectado": "es",

  "probabilidad_idioma": 0.9964,

  "duracion_segundos": 2.84,

  "texto_crudo": "Ayúdame por favor",

  "texto_normalizado": "ayudame por favor",

  "palabras_separadas": ["ayudame", "por", "favor"],

  "palabras_comparables": ["ayudame", "ayuda", "por", "favor"],

  "palabras_unicas": ["ayudame", "ayuda", "por", "favor"],

  "keywords_evaluadas": ["ayuda", "ayudame", "auxilio", "socorro", "emergencia"],

  "coincidencias_exactas": ["ayudame", "ayuda"],

  "coincidencias_difusas": [],

  "mejor_match": {

    "token": "ayudame",

    "keyword": "ayudame",

    "score": 100

  },

  "alerta_detectada": true,

  "threshold_usado": 82,

  "segmentos": [

    {

    "inicio": 0.0,

    "fin": 2.84,

    "texto": "Ayúdame por favor"

    }

  ],

  "modelo": "small",

  "device": "cpu",

  "compute_type": "int8",

  "modo_concurrente": false,

  "endpoint": "https://oaf.pythonanywhere.com/api/audio/detectar-alerta"

}

---

# 4) Qué campos le interesan más a la app móvil

En términos operativos, los más importantes son estos:

* alerta_detectada → true o false
* coincidencias_exactas → palabras detectadas exactamente
* coincidencias_difusas → palabras parecidas, por si la transcripción falló un poco
* texto_normalizado → texto listo para comparar
* mejor_match → mejor coincidencia encontrada

## Ejemplo de lógica simple del móvil

Si llega esto:

{

  "alerta_detectada": true,

  "coincidencias_exactas": ["auxilio"]

}

entonces tu app puede:

* vibrar
* mostrar pantalla roja
* enviar una notificación
* guardar el evento
* llamar otra API
* activar geolocalización
* iniciar un workflow de emergencia

---

# 5) Cómo llamarla desde Android nativo

## Android nativo con Kotlin + OkHttp

/*

Nombre: AudioAlertApi.kt

Fecha: 2026-03-30

Utilidad: Consumir la API de detección de alerta desde Android nativo.

API / Función: OkHttp + multipart/form-data + endpoint Flask remoto

Descripción:

- Envía un archivo de audio grabado en el dispositivo
- Recibe JSON con alerta_detectada, texto_normalizado y coincidencias

Ejemplo de resultado:

- alerta_detectada = true
- coincidencias_exactas = ["ayuda", "ayudame"]

Conexión a API:

- Sí, se conecta a https://oaf.pythonanywhere.com

*/

import okhttp3.*

import java.io.File

import java.io.IOException

fun enviarAudio(file: File) {

    val client = OkHttpClient()

    val requestBody = MultipartBody.Builder()

    .setType(MultipartBody.FORM)

    .addFormDataPart("language", "es")

    .addFormDataPart("threshold", "82")

    .addFormDataPart(

    "archivo",

    file.name,

    file.asRequestBody("audio/mpeg".toMediaTypeOrNull())

    )

    .build()

    val request = Request.Builder()

    .url("https://oaf.pythonanywhere.com/api/audio/detectar-alerta")

    .addHeader("X-API-Key", "TU_CLAVE_PRIVADA")

    .post(requestBody)

    .build()

    client.newCall(request).enqueue(object : Callback {

    override fun onFailure(call: Call, e: IOException) {

    println("Error: ${e.message}")

    }

    override fun onResponse(call: Call, response: Response) {

    val body = response.body?.string()

    println("Respuesta API: $body")

    }

    })

}

## Qué hace Android con la respuesta

Después parseás el JSON y tomás:

* alerta_detectada
* texto_normalizado
* coincidencias_exactas
* coincidencias_difusas

---

# 6) Cómo llamarla desde iPhone nativo

## iOS nativo con Swift + URLSession

/*

Nombre: AudioAlertService.swift

Fecha: 2026-03-30

Utilidad: Consumir la API de detección de alerta desde iOS nativo.

API / Función: URLSession + multipart/form-data + endpoint Flask remoto

Descripción:

- Envía un archivo de audio desde el iPhone
- Recibe JSON con texto y coincidencias de alerta

Ejemplo de resultado:

- alerta_detectada = true
- mejor_match.keyword = "auxilio"

Conexión a API:

- Sí, se conecta a https://oaf.pythonanywhere.com

*/

import Foundation

func enviarAudio(fileURL: URL) {

    let url = URL(string: "https://oaf.pythonanywhere.com/api/audio/detectar-alerta")!

    var request = URLRequest(url: url)

    request.httpMethod = "POST"

    request.setValue("TU_CLAVE_PRIVADA", forHTTPHeaderField: "X-API-Key")

    let boundary = UUID().uuidString

    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

    var data = Data()

    func appendTextField(name: String, value: String) {

    data.append("--\(boundary)\r\n".data(using: .utf8)!)

    data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)

    data.append("\(value)\r\n".data(using: .utf8)!)

    }

    appendTextField(name: "language", value: "es")

    appendTextField(name: "threshold", value: "82")

    if let fileData = try? Data(contentsOf: fileURL) {

    data.append("--\(boundary)\r\n".data(using: .utf8)!)

    data.append("Content-Disposition: form-data; name=\"archivo\"; filename=\"\(fileURL.lastPathComponent)\"\r\n".data(using: .utf8)!)

    data.append("Content-Type: audio/mpeg\r\n\r\n".data(using: .utf8)!)

    data.append(fileData)

    data.append("\r\n".data(using: .utf8)!)

    }

    data.append("--\(boundary)--\r\n".data(using: .utf8)!)

    request.httpBody = data

    URLSession.shared.dataTask(with: request) { responseData, response, error in

    if let error = error {

    print("Error:\(error.localizedDescription)")

    return

    }

    if let responseData = responseData,

    let jsonString = String(data: responseData, encoding: .utf8) {

    print("Respuesta API:\(jsonString)")

    }

    }.resume()

}

---

# 7) Qué recibe exactamente el software nativo

No recibe “audio procesado” ni una pantalla especial.
Recibe un JSON estructurado.

## En la práctica, el software nativo recibe esto:

* un HTTP 200 si salió bien
* un cuerpo JSON con los campos de análisis

## Entonces el software puede hacer:

* comparar alerta_detectada
* mostrar texto_normalizado
* revisar coincidencias_exactas
* validar score en coincidencias_difusas

---

# 8) Ejemplo real de decisión dentro de la app móvil

## Lógica de negocio

Si la API responde:

{

  "alerta_detectada": true,

  "coincidencias_exactas": ["socorro"]

}

la app puede ejecutar:

* mostrar alerta en pantalla
* emitir sonido
* vibrar
* registrar evento
* enviar ubicación
* llamar otro backend
* activar protocolo de emergencia

---

# 9) Si querés que el móvil solo compare palabras

Entonces te conviene usar sobre todo estos campos:

{

  "texto_normalizado": "ayudame por favor",

  "palabras_unicas": ["ayudame", "ayuda", "por", "favor"],

  "coincidencias_exactas": ["ayudame", "ayuda"],

  "coincidencias_difusas": [],

  "alerta_detectada": true

}

Con eso la app nativa casi no necesita pensar demasiado.

---

# 10) Ejemplo de error que también puede recibir el móvil

## Error de autenticación

{

  "ok": false,

  "detail": "No autorizado. API Key inválida o ausente."

}

## Error de archivo

{

  "ok": false,

  "detail": "Debe enviarse un archivo en el campo 'archivo'."

}

## Error de tamaño

{

  "ok": false,

  "detail": "Archivo demasiado grande. Máximo permitido: 20 MB"

}

---

# 11) Resumen ejecutivo

Desde software nativo móvil, la llamada es:

* POST
* a https://oaf.pythonanywhere.com/api/audio/detectar-alerta
* con multipart/form-data
* mandando el archivo en archivo
* y recibiendo un JSON

## Lo más valioso que devuelve

* alerta_detectada
* coincidencias_exactas
* coincidencias_difusas
* texto_normalizado

**
