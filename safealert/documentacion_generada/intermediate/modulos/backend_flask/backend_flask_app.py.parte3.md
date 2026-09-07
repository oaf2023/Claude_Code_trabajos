# Archivo: backend/flask_app.py

> [NOTA] **Parte 3 de 3** del análisis línea por línea del módulo **backend_flask** (auditoría SafeAlert). Continúa el rango de líneas **1101–1591** del archivo `backend/flask_app.py`. La parte 1 (líneas 1–560) y las secciones resumen (Metadatos, Fichas, Seguridad, Riesgos, etc.) están en `backend_flask_app.py.md`; la parte 2 (líneas 561–1100) en `backend_flask_app.py.parte2.md`.

## Análisis línea por línea (parte 3 de 3: líneas 1101–1591)

#### Bloque 33 (líneas 1101–1126) — POST /api/v1/consentimientos

```py
def registrar_consentimiento():
    if not _rate_limit(f"consentimiento:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    tipo = data.get("tipo_permiso", "")
    estado = data.get("estado", "")
    if tipo not in ('UBICACION', 'CAMARA', 'MICROFONO', 'CONTACTOS', 'NOTIFICACIONES'):
        return jsonify({"error": f"tipo_permiso invalido: {tipo}"}), 400
    if estado not in ('OTORGADO', 'RECHAZADO', 'REVOCADO', 'NO_SOLICITADO'):
        return jsonify({"error": f"estado invalido: {estado}"}), 400
    ip = obtener_ip_cliente(request)
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO consentimientos_usuario (
            usuario_id, sesion_id, tipo_permiso, estado,
            texto_mostrado, version_politica, fecha_hora, ip, user_agent
        ) VALUES (?,?,?,?, ?,?,?,?,?)
    """, (
        data.get("usuario_id"), data.get("sesion_id"),
        tipo, estado,
        data.get("texto_mostrado", ""), data.get("version_politica", ""),
        now, ip, request.headers.get("User-Agent", "")
    ))
    db.commit()
    return jsonify({"success": True, "id": db.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]}), 201
```

**Explicación de las líneas 1101–1126:**

Registra un evento de consentimiento de permiso (otorgado/rechazado/revocado) con IP y User-Agent del cliente.

- **Líneas 1102–1103**: rate limit `consentimiento:<remote_addr>` (429).
- **Líneas 1104–1110**: valida `tipo_permiso` y `estado` contra los enumerados (400). No exige `usuario_id` (puede quedar NULL) [OBSERVACIÓN TÉCNICA].
- **Línea 1111**: IP del cliente.
- **Líneas 1112–1124**: `INSERT` de 9 columnas en `consentimientos_usuario`, con `fecha_hora = now` del servidor, `texto_mostrado` y `version_politica` opcionales.
- **Líneas 1125–1126**: `commit` y respuesta 201 con el `id`.
- [ALTO] Sin autenticación: un tercero puede registrar (o revocar aparentemente) consentimientos de cualquier `usuario_id`, dañando la auditoría de privacidad (el modelo es de solo inserción: el estado vigente se infiere de la última fila).

#### Bloque 34 (líneas 1132–1158) — POST /api/v1/consentimientos/revocar

```py
@flask_app.route("/api/v1/consentimientos/revocar", methods=["POST"])
def revocar_consentimiento():
    if not _rate_limit(f"consentimiento:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    usuario_id = data.get("usuario_id", "")
    tipo = data.get("tipo_permiso", "")
    if not usuario_id or not tipo:
        return jsonify({"error": "usuario_id y tipo_permiso requeridos"}), 400
    if tipo not in ('UBICACION', 'CAMARA', 'MICROFONO', 'CONTACTOS', 'NOTIFICACIONES'):
        return jsonify({"error": f"tipo_permiso invalido: {tipo}"}), 400
    ip = obtener_ip_cliente(request)
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO consentimientos_usuario (
            usuario_id, sesion_id, tipo_permiso, estado,
            texto_mostrado, version_politica, fecha_hora, ip, user_agent
        ) VALUES (?,?,?,?, ?,?,?,?,?)
    """, (
        usuario_id, data.get("sesion_id"),
        tipo, "REVOCADO",
        data.get("texto_mostrado", ""), data.get("version_politica", ""),
        now, ip, request.headers.get("User-Agent", "")
    ))
    db.commit()
    return jsonify({"success": True, "message": f"Consentimiento {tipo} revocado"}), 200
```

**Explicación de las líneas 1132–1158:**

Revoca un consentimiento insertando un nuevo registro con `estado='REVOCADO'` (no modifica ni elimina los previos).

- **Líneas 1134–1135**: rate limit (misma clave `consentimiento:`).
- **Líneas 1136–1142**: exige `usuario_id` y `tipo_permiso` válido (400).
- **Líneas 1143–1145**: IP del cliente, `get_db()` y `now`.
- **Líneas 1146–1156**: `INSERT` con estado fijo `REVOCADO`, texto/versión opcionales; `commit`.
- **Líneas 1157–1158**: 200 con mensaje de confirmación.
- [NOTA] Semántica: la "revocación" es un evento más; determinar el estado actual requiere consultar el último registro por `(usuario_id, tipo_permiso)` (no implementado en este archivo).

#### Bloque 35 (líneas 1164–1180) — GET /api/v1/ubicaciones/usuario/<usuario_id>

```py
@flask_app.route("/api/v1/ubicaciones/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_ubicaciones(usuario_id: str):
    limite = request.args.get("limite", 50, type=int)
    limite = min(limite, 200)
    db = get_db()
    rows = db.execute("""
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, proveedor,
               direccion_estimada, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora_servidor DESC
        LIMIT ?
    """, (usuario_id, limite)).fetchall()
    return jsonify([dict(r) for r in rows])
```

**Explicación de las líneas 1164–1180:**

Historial de ubicaciones de un usuario (endpoint administrativo protegido por clave admin).

- **Líneas 1166–1168**: `limite` por query (default 50, acotado a máx 200 con `min()`); `type=int` de Flask devuelve 400 si no es entero.
- **Líneas 1169–1179**: `SELECT` acotado (no expone todas las columnas de la fila) filtrado por `usuario_id`, orden descendente por `fecha_hora_servidor`, `LIMIT ?` (parametrizado).
- **Línea 1180**: respuesta 200 como lista de objetos JSON (`dict(r)` sobre `sqlite3.Row`).
- [NOTA] La consulta devuelve IP, direcciones y coordenadas (datos sensibles) a quien tenga `X-Admin-Key`.

#### Bloque 36 (líneas 1186–1201) — GET /api/v1/ubicaciones/ultima/<usuario_id>

```py
@flask_app.route("/api/v1/ubicaciones/ultima/<usuario_id>", methods=["GET"])
@require_admin_key
def ultima_ubicacion(usuario_id: str):
    db = get_db()
    row = db.execute("""
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora_servidor DESC
        LIMIT 1
    """, (usuario_id,)).fetchone()
    if not row:
        return jsonify({"error": "Sin ubicaciones registradas"}), 404
    return jsonify(dict(row))
```

**Explicación de las líneas 1186–1201:**

Devuelve la ubicación más reciente de un usuario.

- **Líneas 1190–1198**: `SELECT` de columnas acotadas con `ORDER BY fecha_hora_servidor DESC LIMIT 1`.
- **Líneas 1199–1200**: sin registros → 404 `{"error": "Sin ubicaciones registradas"}`.
- **Línea 1201**: 200 con la fila como JSON.
- [NOTA] Si el reloj del dispositivo no está sincronizado (fechas futuras), la "última" podría no ser la más reciente real; no hay índice único que evite empates de fecha (se resuelve por orden de la consulta con el índice DESC).

#### Bloque 37 (líneas 1207–1233) — GET /api/v1/ubicaciones/mapa

```py
@flask_app.route("/api/v1/ubicaciones/mapa", methods=["GET"])
@require_admin_key
def ubicaciones_mapa():
    usuario_id = request.args.get("usuario_id", "")
    origen = request.args.get("origen", "")
    limite = request.args.get("limite", 200, type=int)
    limite = min(limite, 1000)
    db = get_db()
    query = """
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, proveedor, precision_ip_km,
               direccion_estimada, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE 1=1
    """
    params = []
    if usuario_id:
        query += " AND usuario_id = ?"
        params.append(usuario_id)
    if origen and validar_origen(origen):
        query += " AND origen = ?"
        params.append(origen)
    query += " ORDER BY fecha_hora_servidor DESC LIMIT ?"
    params.append(limite)
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])
```

**Explicación de las líneas 1207–1233:**

Devuelve datos para el mapa operativo con filtros opcionales por usuario y origen.

- **Líneas 1210–1213**: parámetros `usuario_id`, `origen` y `limite` (default 200, máx 1000).
- **Líneas 1215–1232**: SQL base con `WHERE 1=1` (facilita concatenar filtros); los filtros se agregan solo con valores parametrizados. `origen` se ignora si no pasa `validar_origen`. Orden descendente y `LIMIT`.
- **Línea 1233**: respuesta 200 como lista JSON.
- [NOTA] La concatenación de SQL usa solo cláusulas fijas + parámetros: no hay inyección SQL. Sin `usuario_id`, devuelve ubicaciones de todos los usuarios (uso previsto: mapa operativo del dashboard admin).

#### Bloque 38 (líneas 1239–1253) — GET /api/v1/ubicaciones/<int:id> y normalizar_mac

```py
@flask_app.route("/api/v1/ubicaciones/<int:id>", methods=["GET"])
@require_admin_key
def detalle_ubicacion(id: int):
    db = get_db()
    row = db.execute("SELECT * FROM ubicaciones_usuario WHERE id = ?", (id,)).fetchone()
    if not row:
        return jsonify({"error": "Ubicacion no encontrada"}), 404
    return jsonify(dict(row))

def normalizar_mac(mac: str) -> str:
    """
    Normaliza una dirección MAC eliminando separadores y llevándola a minúsculas.
    Ej: "AA:BB:CC:DD:EE:FF" -> "aabbccddeeff"
    """
    return re.sub(r"[^0-9a-fA-F]", "", mac or "").lower()
```

**Explicación de las líneas 1239–1253:**

Detalle completo de una ubicación por id y la utilidad de normalización de direcciones MAC.

- **Líneas 1239–1246**: `detalle_ubicacion(id)` — el convertidor `<int:id>` restringe el parámetro a enteros (no entero → 404 de Flask); `SELECT *` devuelve todas las columnas de la fila; 404 si no existe.
- **Líneas 1248–1253**: `normalizar_mac(mac)` — elimina todo carácter no hexadecimal (`re.sub(r"[^0-9a-fA-F]", ...)`) y pasa a minúsculas. Se usa para normalizar el parámetro `mac` en `admin_usuarios` y `admin_pago_simulado` (comparación contra `replace(lower(mac_address),':','')`). Un valor vacío o no hexadecimal produce `""` (búsqueda inefectiva, no error).

#### Bloque 39 (líneas 1261–1314) — GET /api/v1/admin/usuarios

```py
@flask_app.route("/api/v1/admin/usuarios", methods=["GET"])
@require_admin_key
def admin_usuarios():
    busqueda = request.args.get("busqueda", "").strip()
    mac = normalizar_mac(request.args.get("mac", ""))
    plan = request.args.get("plan", "").strip()
    limite = request.args.get("limite", 200, type=int)
    limite = min(limite, 500)
    db = get_db()
    query = """
        SELECT
            u.device_id, u.name, u.phone, u.mac_address, u.device_unique_id,
            u.registered_at, u.subscription_status, u.plan_type,
            u.subscription_expires_at, u.updated_at,
            ul.id AS ultima_ubicacion_id,
            ul.latitud AS ultima_latitud,
            ul.longitud AS ultima_longitud,
            ul.origen AS ultimo_origen,
            ul.precision_metros AS ultima_precision,
            ul.fecha_hora_servidor AS ultima_fecha_hora,
            ul.direccion_confirmada AS ultima_direccion,
            (SELECT COUNT(*) FROM ubicaciones_usuario uu WHERE uu.usuario_id = u.device_id) AS total_ubicaciones
        FROM users u
        LEFT JOIN ubicaciones_usuario ul ON ul.id = (
            SELECT id FROM ubicaciones_usuario
            WHERE usuario_id = u.device_id
            ORDER BY fecha_hora_servidor DESC, id DESC
            LIMIT 1
        )
        WHERE 1=1
    """
    params = []
    if busqueda:
        like = f"%{busqueda}%"
        query += " AND (u.device_id LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.mac_address LIKE ?)"
        params.extend([like, like, like, like])
    if mac:
        query += " AND replace(lower(u.mac_address), ':', '') LIKE ?"
        params.append(f"%{mac}%")
    if plan:
        query += " AND u.plan_type = ?"
        params.append(plan)
    query += " ORDER BY COALESCE(ul.fecha_hora_servidor, u.updated_at) DESC LIMIT ?"
    params.append(limite)
    rows = db.execute(query, params).fetchall()
    resultado = []
    for r in rows:
        d = dict(r)
        d["ultima_ubicacion_id"] = d.get("ultima_ubicacion_id")
        resultado.append(d)
    return jsonify({
        "total": len(resultado),
        "usuarios": resultado
    })
```

**Explicación de las líneas 1261–1314:**

Listado del dashboard administrativo: usuarios con su última ubicación y total de ubicaciones, con filtros por búsqueda, MAC y plan.

- **Líneas 1264–1268**: parámetros `busqueda`, `mac` (normalizada), `plan`, `limite` (default 200, máx 500).
- **Líneas 1270–1291**: `SELECT` de `users` + `LEFT JOIN` contra la subconsulta que obtiene la fila de última ubicación por usuario (`ORDER BY fecha_hora_servidor DESC, id DESC LIMIT 1`) + subconsulta de `COUNT(*)` de ubicaciones por usuario.
- **Líneas 1292–1303**: filtros parametrizados: `busqueda` con `LIKE` sobre 4 columnas (comodín `%...%`); `mac` con `LIKE` sobre la MAC normalizada en SQL; `plan` por igualdad.
- **Líneas 1303–1304**: orden por última actividad (`COALESCE(ul.fecha_hora_servidor, u.updated_at) DESC`) con `LIMIT`.
- **Líneas 1306–1310**: convierte filas a dicts (la reasignación de `ultima_ubicacion_id` es un no-op, el valor ya viene del dict) [OBSERVACIÓN TÉCNICA].
- **Líneas 1311–1314**: respuesta 200 con `total` y `usuarios`.
- [MEDIO] Expone PII (name, phone, MAC, device_unique_id) y coordenadas a quien posea la clave admin; la consulta con subconsultas por fila puede degradarse con muchos usuarios [OBSERVACIÓN TÉCNICA].

#### Bloque 40 (líneas 1323–1384) — POST /api/v1/admin/pagos/simular (validación, búsqueda y activación)

```py
@flask_app.route("/api/v1/admin/pagos/simular", methods=["POST"])
@require_admin_key
def admin_pago_simulado():
    if not _rate_limit(f"pago_sim:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    mac = normalizar_mac(data.get("mac_address", ""))
    device_id = str(data.get("device_id", "")).strip()
    plan_type = data.get("plan_type", "monthly").strip()
    dias = int(data.get("dias", 0) or 0)

    if plan_type not in ("monthly", "annual"):
        return jsonify({"error": "plan_type debe ser monthly o annual"}), 400
    if not mac and not device_id:
        return jsonify({"error": "Se requiere mac_address o device_id"}), 400
    if dias <= 0:
        dias = 32 if plan_type == "monthly" else 380

    db = get_db()
    now = datetime.utcnow().isoformat()

    if device_id:
        row = db.execute("SELECT * FROM users WHERE device_id = ?", (device_id,)).fetchone()
        if not row:
            return jsonify({"error": "device_id no encontrado"}), 404
    else:
        rows = db.execute(
            "SELECT * FROM users WHERE replace(lower(mac_address), ':', '') LIKE ?",
            (f"%{mac}%",)
        ).fetchall()
        if not rows:
            return jsonify({"error": "No se encontró un usuario con esa MAC"}), 404
        if len(rows) > 1:
            return jsonify({"error": "La MAC coincide con varios usuarios. Usá device_id para desambiguar."}), 409
        row = rows[0]

    expires_at = (datetime.utcnow() + timedelta(days=dias)).isoformat()

    db.execute(
        "UPDATE users SET subscription_status='active', plan_type=?, "
        "subscription_expires_at=?, updated_at=? WHERE device_id=?",
        (plan_type, expires_at, now, row["device_id"])
    )

    db.execute(
        "INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) "
        "VALUES (?, 'admin_simulated', ?, ?, ?)",
        (row["device_id"], "", json.dumps({"plan_type": plan_type, "dias": dias,
                                           "simulado": True, "por_mac": bool(mac)}), now)
    )

    ticket_row = db.execute(
        "SELECT COALESCE(MAX(ticket_number), 0) AS ultimo FROM tickets"
    ).fetchone()
    ticket_number = int(ticket_row["ultimo"]) + 1
    amount = 75000 if plan_type == "annual" else 7500
    db.execute(
        "INSERT INTO tickets (ticket_number, device_id, user_name, plan_type, amount, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ticket_number, row["device_id"], row["name"], plan_type, amount, now)
    )
    db.commit()
```

**Explicación de las líneas 1323–1384:**

Simulador administrativo de pagos: activa la suscripción de un usuario (buscado por MAC o `device_id`) sin contacto con Mercado Pago y genera el ticket correlativo.

- **Líneas 1326–1327**: rate limit `pago_sim:<remote_addr>` (429).
- **Líneas 1328–1332**: extrae y normaliza `mac_address`; `device_id`; `plan_type` (default `monthly`); `dias` como entero (`int(...)` lanzaría `ValueError` → 500 si no es numérico) [OBSERVACIÓN TÉCNICA].
- **Líneas 1334–1339**: validaciones: plan válido (400); se requiere MAC o device_id (400); si `dias <= 0` usa 32 (monthly) o 380 (annual).
- **Líneas 1344–1347**: búsqueda por `device_id` exacto (404 si no existe).
- **Líneas 1348–1357**: búsqueda por MAC con `LIKE` sobre MAC normalizada; 404 si no hay coincidencia; 409 si coincide con varios usuarios (pide `device_id`).
- **Línea 1359**: `expires_at = now + dias`.
- **Líneas 1361–1365**: `UPDATE users` a `subscription_status='active'` con plan y expiración (¡sin pago real!).
- **Líneas 1367–1372**: registra evento `admin_simulated` en `payment_events` (payload indica `simulado: True` y si fue por MAC).
- **Líneas 1374–1377**: correlativo `MAX(ticket_number)+1` (mismo riesgo de concurrencia que `crear_ticket`).
- **Línea 1378**: importes fijos del simulador: 75000 annual / 7500 monthly.
- **Líneas 1379–1383**: `INSERT` en `tickets` con el nombre del usuario.
- **Línea 1384**: `commit`.
- [ALTO] Endpoint de pruebas que otorga suscripciones activas sin verificación de pago, desplegado junto a producción (protegido solo por la clave admin estática).

#### Bloque 41 (líneas 1386–1407) — POST /api/v1/admin/pagos/simular (log y respuesta)

```py
    logger.info("[SafeAlert] Pago simulado (admin): device=%s mac=%s plan=%s dias=%d ticket=%d",
                row["device_id"], row["mac_address"], plan_type, dias, ticket_number)

    return jsonify({
        "success": True,
        "ticket": {
            "ticket_number": ticket_number,
            "date": datetime.utcnow().strftime("%d/%m/%Y"),
            "time": datetime.utcnow().strftime("%H:%M"),
            "plan_type": plan_type,
            "amount": amount,
            "contact_email": "safealert_contacto@manejadatos.com",
        },
        "usuario": {
            "device_id": row["device_id"],
            "name": row["name"],
            "mac_address": row["mac_address"],
            "subscription_status": "active",
            "plan_type": plan_type,
            "subscription_expires_at": expires_at,
        },
    })
```

**Explicación de las líneas 1386–1407:**

Cierre del simulador: registro de auditoría y respuesta con ticket y datos del usuario activado.

- **Líneas 1386–1387**: log INFO con `device`, **MAC completa** (PII en logs) [MEDIO], plan, días y ticket.
- **Líneas 1389–1407**: respuesta 200 con `ticket` (formato idéntico a `crear_ticket`, incluido el correo fijo) y el objeto `usuario` con el estado activado. `subscription_status` se devuelve fijo como `"active"` (coherente con el UPDATE previo).

#### Bloque 42 (líneas 1414–1472) — GET /api/v1/admin/stats (KPIs y agregados)

```py
@flask_app.route("/api/v1/admin/stats", methods=["GET"])
@require_admin_key
def admin_stats():
    db = get_db()
    ahora = datetime.utcnow()
    hace_24h = (ahora - timedelta(hours=24)).isoformat()
    hace_7d = (ahora - timedelta(days=7)).isoformat()
    hace_30d = (ahora - timedelta(days=30)).isoformat()

    total_usuarios = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    usuarios_activos_24h = db.execute(
        "SELECT COUNT(DISTINCT usuario_id) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_24h,)
    ).fetchone()["c"]
    usuarios_activos_7d = db.execute(
        "SELECT COUNT(DISTINCT usuario_id) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_7d,)
    ).fetchone()["c"]
    total_ubicaciones = db.execute("SELECT COUNT(*) c FROM ubicaciones_usuario").fetchone()["c"]
    total_accesos = db.execute("SELECT COUNT(*) c FROM accesos_tecnicos").fetchone()["c"]
    total_consentimientos = db.execute("SELECT COUNT(*) c FROM consentimientos_usuario").fetchone()["c"]

    ubicaciones_24h = db.execute(
        "SELECT COUNT(*) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_24h,)
    ).fetchone()["c"]
    accesos_24h = db.execute(
        "SELECT COUNT(*) c FROM accesos_tecnicos WHERE fecha_hora >= ?",
        (hace_24h,)
    ).fetchone()["c"]

    por_origen = db.execute(
        "SELECT origen, COUNT(*) c FROM ubicaciones_usuario GROUP BY origen"
    ).fetchall()
    por_dia = db.execute(
        "SELECT substr(fecha_hora_servidor, 1, 10) dia, COUNT(*) c "
        "FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ? "
        "GROUP BY dia ORDER BY dia",
        (hace_30d,)
    ).fetchall()
    por_dispositivo = db.execute(
        "SELECT tipo_dispositivo, COUNT(*) c FROM accesos_tecnicos "
        "WHERE tipo_dispositivo IS NOT NULL AND tipo_dispositivo != '' "
        "GROUP BY tipo_dispositivo ORDER BY c DESC LIMIT 10"
    ).fetchall()
    por_estado_suscripcion = db.execute(
        "SELECT subscription_status, COUNT(*) c FROM users GROUP BY subscription_status"
    ).fetchall()
    por_estado_consentimiento = db.execute(
        "SELECT estado, COUNT(*) c FROM consentimientos_usuario GROUP BY estado"
    ).fetchall()
    por_permiso_ubicacion = db.execute(
        "SELECT permiso_ubicacion, COUNT(*) c FROM ubicaciones_usuario "
        "WHERE permiso_ubicacion IS NOT NULL GROUP BY permiso_ubicacion"
    ).fetchall()
    por_plan = db.execute(
        "SELECT COALESCE(plan_type, 'sin_plan') plan_type, COUNT(*) c FROM users "
        "GROUP BY plan_type ORDER BY c DESC"
    ).fetchall()
```

**Explicación de las líneas 1414–1472:**

Primera mitad de `admin_stats`: calcula KPIs agregados con consultas `COUNT`/`GROUP BY` sobre las tablas de trazabilidad.

- **Líneas 1418–1421**: ventanas de tiempo (24 h, 7 d, 30 d) como ISO naïf UTC para comparar contra las columnas TEXT de fechas.
- **Líneas 1423–1434**: totales: usuarios, usuarios activos distintos por ubicación en 24 h/7 d, ubicaciones, accesos y consentimientos.
- **Líneas 1436–1443**: actividad de ubicaciones y accesos en las últimas 24 h.
- **Líneas 1445–1447**: ubicaciones agrupadas por `origen`.
- **Líneas 1448–1453**: ubicaciones por día (`substr(fecha_hora_servidor,1,10)` extrae la fecha) en los últimos 30 d.
- **Líneas 1454–1458**: top 10 de tipos de dispositivo (accesos).
- **Líneas 1459–1461**: usuarios por estado de suscripción.
- **Líneas 1462–1464**: consentimientos por estado.
- **Líneas 1465–1468**: ubicaciones por permiso.
- **Líneas 1469–1472**: usuarios por plan (`COALESCE(..., 'sin_plan')`).
- [INFORMATIVO] Varias consultas secuenciales; los índices existentes cubren usuario/fecha/origen, pero agregaciones globales (`COUNT(*)` sobre toda la tabla) escanean las tablas completas.

#### Bloque 43 (líneas 1474–1493) — GET /api/v1/admin/stats (respuesta JSON)

```py
    return jsonify({
        "kpis": {
            "total_usuarios": total_usuarios,
            "usuarios_activos_24h": usuarios_activos_24h,
            "usuarios_activos_7d": usuarios_activos_7d,
            "total_ubicaciones": total_ubicaciones,
            "ubicaciones_24h": ubicaciones_24h,
            "total_accesos": total_accesos,
            "accesos_24h": accesos_24h,
            "total_consentimientos": total_consentimientos,
        },
        "ubicaciones_por_origen": [dict(r) for r in por_origen],
        "ubicaciones_por_dia": [dict(r) for r in por_dia],
        "accesos_por_dispositivo": [dict(r) for r in por_dispositivo],
        "usuarios_por_estado_suscripcion": [dict(r) for r in por_estado_suscripcion],
        "consentimientos_por_estado": [dict(r) for r in por_estado_consentimiento],
        "ubicaciones_por_permiso": [dict(r) for r in por_permiso_ubicacion],
        "usuarios_por_plan": [dict(r) for r in por_plan],
        "generado_en": ahora.isoformat(),
    })
```

**Explicación de las líneas 1474–1493:**

Compone la respuesta JSON del dashboard con los KPIs y agregados calculados.

- **Líneas 1475–1484**: bloque `kpis` con los 8 contadores.
- **Líneas 1485–1491**: agregados serializados con `dict(r)` por cada `GROUP BY`.
- **Línea 1492**: `generado_en` con la marca de tiempo del cálculo.
- [INFORMATIVO] La respuesta expone métricas de privacidad (estados de consentimiento, permisos de ubicación) y de negocio al poseedor de la clave admin; no hay paginación porque son agregados.

#### Bloque 44 (líneas 1499–1518) — GET /api/v1/estado (health check extendido)

```py
@flask_app.route("/api/v1/estado", methods=["GET"])
def estado_sistema():
    db = get_db()
    total_ubicaciones = db.execute("SELECT COUNT(*) as c FROM ubicaciones_usuario").fetchone()["c"]
    total_accesos = db.execute("SELECT COUNT(*) as c FROM accesos_tecnicos").fetchone()["c"]
    total_consentimientos = db.execute("SELECT COUNT(*) as c FROM consentimientos_usuario").fetchone()["c"]
    db_ok = True
    try:
        db.execute("SELECT 1").fetchone()
    except Exception:
        db_ok = False
    ip_actual = obtener_ip_cliente(request)
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "base_datos": {"conectada": db_ok, "ubicaciones": total_ubicaciones, "accesos": total_accesos, "consentimientos": total_consentimientos},
        "servidor": {"ip_publica": ip_actual, "proveedor_geo": "ip-api.com"},
        "retencion": {"accesos_dias": RETENCION_ACCESOS_DIAS, "ubicaciones_dias": RETENCION_UBICACIONES_DIAS, "consentimientos_dias": RETENCION_CONSENTIMIENTOS_DIAS, "logs_dias": RETENCION_LOGS_DIAS},
        "version_api": "v1"
    })
```

**Explicación de las líneas 1499–1518:**

Health check extendido sin autenticación que reporta estado de BD, conteos, IP del servidor, política de retención y versión de API.

- **Líneas 1502–1504**: conteos de las tres tablas de trazabilidad (obliga a que la BD exista; si la conexión falla se propagaría la excepción, sin manejador) [OBSERVACIÓN TÉCNICA].
- **Líneas 1505–1509**: prueba `SELECT 1` para el flag `db_ok`.
- **Línea 1510**: IP "pública" vista del cliente (`obtener_ip_cliente`).
- **Líneas 1511–1518**: respuesta 200 con `status`, `timestamp`, `base_datos`, `servidor` (con `proveedor_geo` fijo `"ip-api.com"`, aunque el servicio real usa fallback ipregistry) [OBSERVACIÓN TÉCNICA], `retencion` (incluye `logs_dias` no aplicado) y `version_api`.
- [MEDIO] Sin autenticación expone la IP pública del servidor, volúmenes de datos y parámetros de retención (información de reconocimiento).

#### Bloque 45 (líneas 1524–1556) — Historiales administrativos de consentimientos y accesos

```py
@flask_app.route("/api/v1/consentimientos/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_consentimientos(usuario_id: str):
    db = get_db()
    rows = db.execute("""
        SELECT id, tipo_permiso, estado, version_politica, fecha_hora
        FROM consentimientos_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora DESC
    """, (usuario_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# GET /api/v1/accesos/usuario/<usuario_id> — Historial accesos (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/accesos/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_accesos(usuario_id: str):
    limite = request.args.get("limite", 50, type=int)
    limite = min(limite, 200)
    db = get_db()
    rows = db.execute("""
        SELECT id, fecha_hora, ip, metodo_http, ruta_consultada, endpoint,
               codigo_respuesta, user_agent, navegador_aproximado,
               sistema_operativo_aproximado, tipo_dispositivo,
               pais_ip, ciudad_ip, proveedor
        FROM accesos_tecnicos
        WHERE usuario_id = ?
        ORDER BY fecha_hora DESC
        LIMIT ?
    """, (usuario_id, limite)).fetchall()
    return jsonify([dict(r) for r in rows])
```

**Explicación de las líneas 1524–1556:**

Dos endpoints administrativos de historial (consentimientos y accesos técnicos por usuario), ambos con `require_admin_key`.

- **Líneas 1524–1534**: `historial_consentimientos` — `SELECT` acotado (id, tipo, estado, versión de política, fecha) ordenado descendente; sin límite de filas (puede devolver todo el historial de consentimientos de un usuario) [OBSERVACIÓN TÉCNICA].
- **Líneas 1540–1556**: `historial_accesos` — `limite` por query (default 50, máx 200); `SELECT` acotado de columnas de trazabilidad (incluye IP, país/ciudad por IP, user-agent) por `usuario_id`, descendente, `LIMIT ?`.
- [NOTA] Respuestas 200 como listas JSON; el filtrado se hace con parámetros (sin inyección SQL). Ambos dependen de la clave admin estática.

#### Bloque 46 (líneas 1562–1583) — Política de retención: purga y endpoint administrativo

```py
def ejecutar_purga_retencion():
    """Elimina registros antiguos según política de retención configurada."""
    db = get_db()
    ahora = datetime.utcnow().isoformat()
    corte_accesos = (datetime.utcnow() - timedelta(days=RETENCION_ACCESOS_DIAS)).isoformat()
    corte_ubicaciones = (datetime.utcnow() - timedelta(days=RETENCION_UBICACIONES_DIAS)).isoformat()
    corte_consentimientos = (datetime.utcnow() - timedelta(days=RETENCION_CONSENTIMIENTOS_DIAS)).isoformat()
    eliminados_accesos = db.execute("DELETE FROM accesos_tecnicos WHERE fecha_hora < ?", (corte_accesos,)).rowcount
    eliminados_ubicaciones = db.execute("DELETE FROM ubicaciones_usuario WHERE creado_en < ?", (corte_ubicaciones,)).rowcount
    eliminados_consentimientos = db.execute("DELETE FROM consentimientos_usuario WHERE fecha_hora < ?", (corte_consentimientos,)).rowcount
    db.commit()
    logger.info("[Retencion] Purga completada: accesos=%d ubicaciones=%d consents=%d",
                eliminados_accesos, eliminados_ubicaciones, eliminados_consentimientos)
    return {"accesos": eliminados_accesos, "ubicaciones": eliminados_ubicaciones, "consentimientos": eliminados_consentimientos}

@flask_app.route("/api/v1/admin/purga", methods=["POST"])
@require_admin_key
def purga_retencion():
    if not _rate_limit(f"purga:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    resultado = ejecutar_purga_retencion()
    return jsonify({"success": True, "eliminados": resultado})
```

**Explicación de las líneas 1562–1583:**

Implementa la purga por política de retención (Prompt Maestro sección 19): borrado físico de registros anteriores a los umbrales configurados, invocable solo por admin.

- **Líneas 1562–1575**: `ejecutar_purga_retencion()` — calcula los cortes (hoy - N días) y ejecuta tres `DELETE` masivos: accesos por `fecha_hora`, ubicaciones por `creado_en`, consentimientos por `fecha_hora`; `commit`; log INFO con los conteos; devuelve `{"accesos": n, "ubicaciones": n, "consentimientos": n}`. La variable `ahora` (línea 1565) se calcula pero no se usa [POTENCIALMENTE NO UTILIZADO].
- **Líneas 1577–1583**: `purga_retencion` — rate limit `purga:<remote_addr>` y delega en `ejecutar_purga_retencion`; responde 200 con los eliminados.
- [OBSERVACIÓN TÉCNICA] No hay programación automática en este archivo (docstring dice "purga programada", pero solo existe el endpoint manual); la purga no cubre `payment_events`, `tickets`, `users` ni la retención de logs (`RETENCION_LOGS_DIAS`).
- [RIESGO] Borrado físico definitivo (sin soft delete ni copia de seguridad) una vez superados los umbrales.

#### Bloque 47 (líneas 1589–1591) — Ejecución directa

```py
if __name__ == "__main__":
    DEBUG_MODE = os.environ.get("FLASK_DEBUG", "0") == "1"
    flask_app.run(debug=DEBUG_MODE)
```

**Explicación de las líneas 1589–1591:**

Permite ejecutar `python flask_app.py` como servidor de desarrollo.

- **Línea 1590**: `DEBUG_MODE` se activa solo si la variable de entorno `FLASK_DEBUG` vale `"1"` (default desactivado).
- **Línea 1591**: `flask_app.run(debug=DEBUG_MODE)` — arranca el servidor integrado de Flask (uso de desarrollo; en PythonAnywhere la entrada real es `wsgi.py`, que importa `flask_app` sin ejecutar este bloque).
- [INFORMATIVO] Si `FLASK_DEBUG=1` en producción y alguien ejecuta el módulo directamente, el debugger de Werkzeug queda expuesto; en el despliegue WSGI normal no aplica.

[NOTA] **Fin de la parte 3 de 3 (líneas 1101–1591).** Con esto queda cubierto el archivo completo `backend/flask_app.py` (1591 líneas). Las secciones resumen del análisis (Metadatos, Objetivo, Clasificación y estado, Dependencias, Componentes dependientes, Variables, Estructura, Fichas de rutas/funciones, Clases, Observaciones técnicas, Seguridad y Riesgos y recomendaciones) están en `backend_flask_app.py.md`.