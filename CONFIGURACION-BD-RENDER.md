# Configuración para usar Base de Datos de Render Localmente

Este documento explica cómo configurar el proyecto para usar la base de datos de Render en lugar de la base de datos local de Docker.

## Opción 1: Usar docker-compose.render.yml (Recomendado)

### Pasos:

1. **Crear archivo `.env`** en la raíz del proyecto:
   ```bash
   cp env.example .env
   ```

2. **Editar `.env`** y configurar tu `DATABASE_URL` de Render:
   ```env
   # Comentar o eliminar las variables DB_* locales
   # DB_HOST=postgres
   # DB_PORT=5432
   # DB_NAME=catalogo_productos
   # DB_USER=postgres
   # DB_PASSWORD=postgres

   # Descomentar y configurar tu DATABASE_URL de Render
   DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
   
   # Ejemplo real:
   # DATABASE_URL=postgresql://catalogo_user:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/catalogo_productos?sslmode=require
   ```

3. **Iniciar servicios** usando el archivo docker-compose para Render:
   ```bash
   docker-compose -f docker-compose.render.yml up --build -d
   ```

4. **Verificar que funciona**:
   ```bash
   docker-compose -f docker-compose.render.yml logs api
   ```

## Opción 2: Modificar docker-compose.yml directamente

Si prefieres usar el archivo `docker-compose.yml` principal:

1. **Crear archivo `.env`** con `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
   ```

2. **Iniciar solo los servicios necesarios** (sin postgres):
   ```bash
   docker-compose up api frontend --build -d
   ```

   O si prefieres, puedes comentar el servicio `postgres` en `docker-compose.yml`.

## Obtener DATABASE_URL de Render

1. Ve a tu dashboard de Render
2. Selecciona tu base de datos PostgreSQL
3. En la sección "Connections", encontrarás la "Internal Database URL"
4. Copia esa URL y úsala como `DATABASE_URL` en tu `.env`

**Nota**: Para conexiones externas (desde tu máquina local), Render también proporciona una "External Database URL" que puedes usar.

## Verificar la conexión

Puedes verificar que la conexión funciona revisando los logs:

```bash
# Ver logs del API
docker-compose logs api

# Deberías ver algo como:
# ✅ Conexión a PostgreSQL exitosa
#    Conexión: DATABASE_URL (dpg-xxxxx-a.oregon-postgres.render.com:5432)
```

## Volver a usar BD local

Si quieres volver a usar la base de datos local:

1. **Editar `.env`** y comentar `DATABASE_URL`, descomentar las variables `DB_*`:
   ```env
   # DATABASE_URL=...
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=catalogo_productos
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

2. **Usar docker-compose.yml normal**:
   ```bash
   docker-compose up --build -d
   ```

## Troubleshooting

### Error: "connection refused"
- Verifica que tu `DATABASE_URL` sea correcta
- Asegúrate de que la base de datos de Render esté activa
- Si usas la URL externa, verifica que tu IP esté permitida en Render

### Error: "SSL required"
- Asegúrate de que tu `DATABASE_URL` incluya `?sslmode=require` al final
- Ejemplo: `postgresql://user:pass@host:port/db?sslmode=require`

### Error: "database does not exist"
- Verifica que el nombre de la base de datos en la URL sea correcto
- La base de datos se creará automáticamente al iniciar si no existe (gracias a `initializeDatabase()`)

### Los servicios no inician
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Revisa los logs: `docker-compose logs api`

