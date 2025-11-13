# 📤 Guía Paso a Paso: Subir Cambios a GitHub

Esta guía te ayudará a subir todos los cambios realizados al repositorio de GitHub.

## 📋 Resumen de Cambios

Los siguientes archivos han sido modificados o creados:

### Archivos Modificados:
- `README.md` - Agregada sección sobre uso de Render
- `docker-compose.yml` - Configurado para usar variables de entorno
- `services/frontend/public/index.html` - Agregada galería visual de productos

### Archivos Nuevos:
- `CONFIGURACION-BD-RENDER.md` - Documentación para usar BD de Render
- `docker-compose.render.yml` - Docker Compose para Render
- `env.example` - Plantilla de variables de entorno
- `start-with-render.ps1` - Script PowerShell para iniciar con Render
- `start-with-render.sh` - Script Bash para iniciar con Render

---

## 🚀 Método 1: Usando el Script Automático (Recomendado)

### Windows (PowerShell):
```powershell
.\scripts\subir-github.ps1
```

El script te guiará paso a paso:
1. ✅ Verificará Git
2. ✅ Mostrará los archivos modificados
3. ✅ Te pedirá confirmación
4. ✅ Creará el commit
5. ✅ Subirá los cambios

---

## 🛠️ Método 2: Manual (Paso a Paso)

### Paso 1: Verificar el estado actual
```bash
git status
```

Deberías ver los archivos modificados y nuevos listados.

### Paso 2: Agregar todos los archivos al staging
```bash
# Agregar todos los archivos
git add .

# O agregar archivos específicos:
git add README.md
git add docker-compose.yml
git add services/frontend/public/index.html
git add CONFIGURACION-BD-RENDER.md
git add docker-compose.render.yml
git add env.example
git add start-with-render.ps1
git add start-with-render.sh
```

### Paso 3: Verificar qué se agregó
```bash
git status
```

Deberías ver todos los archivos en verde (staged).

### Paso 4: Crear el commit
```bash
git commit -m "Agregar galería visual y soporte para base de datos de Render

- Agregada sección de galería visual con modal para ver imágenes en grande
- Configuración para usar base de datos de Render localmente
- Scripts helper para iniciar con Render
- Documentación actualizada"
```

O un mensaje más simple:
```bash
git commit -m "Agregar galería visual y configuración para Render"
```

### Paso 5: Subir los cambios a GitHub
```bash
git push origin main
```

Si es la primera vez, usa:
```bash
git push -u origin main
```

---

## ✅ Verificación

Después de subir, verifica en GitHub:
1. Ve a: https://github.com/rolandoloera/catalogo-productos
2. Deberías ver los nuevos archivos y cambios
3. Revisa el commit más reciente

---

## 🔧 Solución de Problemas

### Error: "Please tell me who you are"
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Error: "Authentication failed"
1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Crea un nuevo token con permisos `repo`
3. Usa el token como contraseña cuando Git te lo pida

### Error: "Updates were rejected"
Si alguien más hizo cambios:
```bash
# Obtener los últimos cambios
git pull origin main

# Resolver conflictos si los hay, luego:
git add .
git commit -m "Merge cambios remotos"
git push origin main
```

### Ver los cambios antes de commitear
```bash
# Ver diferencias en archivos modificados
git diff

# Ver diferencias en archivos staged
git diff --staged
```

---

## 📝 Comandos Útiles

```bash
# Ver historial de commits
git log --oneline

# Ver cambios en un archivo específico
git diff README.md

# Deshacer cambios en un archivo (antes de git add)
git restore archivo.txt

# Deshacer git add (quitar del staging)
git restore --staged archivo.txt

# Ver el estado actual
git status
```

---

## 🎯 Checklist Antes de Subir

- [ ] Revisar cambios con `git status`
- [ ] Verificar que no hay archivos sensibles (contraseñas, tokens)
- [ ] Asegurarse de que `.env` NO esté en el repositorio (está en .gitignore)
- [ ] Escribir un mensaje de commit descriptivo
- [ ] Verificar que todo funciona localmente

---

## 🚨 Importante

**NUNCA subas archivos con información sensible:**
- ❌ `.env` (ya está en .gitignore)
- ❌ Contraseñas o tokens
- ❌ Archivos de configuración local

El archivo `.env` está en `.gitignore`, así que está seguro.

---

## 📚 Próximos Pasos

Después de subir los cambios:
1. ✅ Verifica que todo esté en GitHub
2. 📖 Si usas Render, los cambios se desplegarán automáticamente
3. 🔄 Si no, sigue la guía en `DEPLOY-RENDER.md`

---

¿Necesitas ayuda? Revisa:
- `GITHUB-SETUP.md` - Configuración inicial de GitHub
- `DEPLOY-RENDER.md` - Desplegar en Render

