# 📤 Guía: Subir Código a GitHub

Esta guía te ayudará a subir tu proyecto de catálogo de productos a GitHub para poder desplegarlo en Render.com.

## 📋 Pasos para Subir a GitHub

### Paso 1: Crear un Repositorio en GitHub

1. Ve a [GitHub.com](https://github.com) e inicia sesión (o crea una cuenta si no tienes)
2. Click en el botón **"+"** (arriba a la derecha) → **"New repository"**
3. Configura el repositorio:
   - **Repository name**: `catalogo-productos` (o el nombre que prefieras)
   - **Description**: "Catálogo de productos con microservicios - Node.js + PostgreSQL"
   - **Visibility**: 
     - ✅ **Public** (gratis, cualquiera puede verlo)
     - 🔒 **Private** (solo tú puedes verlo)
   - **NO marques** "Initialize this repository with a README" (ya tienes uno)
   - **NO marques** "Add .gitignore" (ya tienes uno)
   - **NO marques** "Choose a license"
4. Click en **"Create repository"**

5. **IMPORTANTE**: GitHub te mostrará una página con instrucciones. **NO las sigas todavía**, primero necesitamos preparar tu código local.

---

### Paso 2: Preparar tu Código Local

Abre PowerShell o Terminal en la carpeta de tu proyecto:

```powershell
# Asegúrate de estar en la carpeta correcta
cd C:\Bitbucket\test_loera\catalogo-productos
```

#### 2.1 Inicializar Git (si no está inicializado)

```powershell
git init
```

#### 2.2 Verificar qué archivos se van a subir

```powershell
git status
```

Deberías ver todos tus archivos listados. Si ves `node_modules`, necesitamos actualizar el `.gitignore`.

#### 2.3 Agregar todos los archivos al staging

```powershell
git add .
```

Esto agrega todos los archivos (excepto los que están en `.gitignore`).

#### 2.4 Hacer el primer commit

```powershell
git commit -m "Initial commit: Catálogo de productos con microservicios"
```

---

### Paso 3: Conectar con GitHub

#### 3.1 Agregar el repositorio remoto

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub:

```powershell
git remote add origin https://github.com/TU_USUARIO/catalogo-productos.git
```

**Ejemplo:**
```powershell
git remote add origin https://github.com/juanperez/catalogo-productos.git
```

#### 3.2 Verificar la conexión

```powershell
git remote -v
```

Deberías ver:
```
origin  https://github.com/TU_USUARIO/catalogo-productos.git (fetch)
origin  https://github.com/TU_USUARIO/catalogo-productos.git (push)
```

---

### Paso 4: Subir el Código a GitHub

#### 4.1 Cambiar a la rama main (si es necesario)

```powershell
git branch -M main
```

#### 4.2 Hacer push al repositorio

```powershell
git push -u origin main
```

**Nota**: Si es la primera vez, GitHub te pedirá autenticarte:
- Te abrirá el navegador para iniciar sesión
- O te pedirá usuario y contraseña/token

---

### Paso 5: Verificar en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/TU_USUARIO/catalogo-productos`
2. Deberías ver todos tus archivos
3. ✅ ¡Listo! Tu código está en GitHub

---

## 🔄 Comandos para Futuros Cambios

Cada vez que hagas cambios y quieras subirlos:

```powershell
# 1. Ver qué archivos cambiaron
git status

# 2. Agregar los archivos modificados
git add .

# 3. Hacer commit con un mensaje descriptivo
git commit -m "Descripción de los cambios"

# 4. Subir los cambios a GitHub
git push
```

---

## 🔐 Autenticación con GitHub

### Opción 1: Personal Access Token (Recomendado)

Si GitHub te pide autenticación:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en **"Generate new token (classic)"**
3. Dale un nombre: `Render Deployment`
4. Selecciona el scope: **`repo`** (acceso completo a repositorios)
5. Click en **"Generate token"**
6. **Copia el token** (solo se muestra una vez)
7. Cuando Git te pida contraseña, usa el token en lugar de tu contraseña

### Opción 2: GitHub CLI

```powershell
# Instalar GitHub CLI (si no lo tienes)
winget install GitHub.cli

# Autenticarse
gh auth login
```

---

## ✅ Checklist

Antes de desplegar en Render, verifica:

- [ ] Repositorio creado en GitHub
- [ ] Código subido a GitHub (puedes verlo en la web)
- [ ] Archivo `render.yaml` está en el repositorio
- [ ] Archivo `DEPLOY-RENDER.md` está en el repositorio
- [ ] `.gitignore` incluye `node_modules/` y otros archivos sensibles
- [ ] No hay archivos sensibles (contraseñas, tokens) en el código

---

## 🚨 Problemas Comunes

### Error: "remote origin already exists"

```powershell
# Eliminar el remote existente
git remote remove origin

# Agregar el correcto
git remote add origin https://github.com/TU_USUARIO/catalogo-productos.git
```

### Error: "failed to push some refs"

```powershell
# Si GitHub tiene archivos que no tienes localmente
git pull origin main --allow-unrelated-histories

# Luego intenta push de nuevo
git push -u origin main
```

### Error: "authentication failed"

- Verifica que tu usuario y contraseña/token sean correctos
- Usa un Personal Access Token en lugar de tu contraseña
- Asegúrate de tener permisos en el repositorio

---

## 📝 Notas Importantes

1. **NO subas archivos sensibles**:
   - Contraseñas
   - Tokens de API
   - Archivos `.env` con credenciales
   - Claves privadas

2. **El `.gitignore` ya está configurado** para ignorar:
   - `node_modules/`
   - Archivos `.env`
   - Logs

3. **Render necesita acceso a tu repositorio**:
   - Cuando conectes Render, autoriza el acceso
   - Render solo leerá el código, no lo modificará

---

## 🎯 Siguiente Paso

Una vez que tu código esté en GitHub:

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Sigue la guía en `DEPLOY-RENDER.md`
3. Conecta tu repositorio de GitHub
4. ¡Despliega tu aplicación!

---

¿Necesitas ayuda con algún paso? ¡Pregunta!

