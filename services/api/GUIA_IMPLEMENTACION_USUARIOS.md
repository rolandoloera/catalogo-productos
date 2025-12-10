# Guía Paso a Paso: Implementar Endpoints de Usuarios

Esta guía te ayudará a implementar todos los endpoints necesarios para el sistema multi-usuario.

## 📋 Paso 1: Actualizar el Middleware de Autenticación

Primero, necesitamos modificar `auth.js` para soportar el rol "owner" y crear un middleware para verificar permisos.

### 1.1 Modificar `auth.js`

Abre el archivo `test_loera/catalogo-productos/services/api/auth.js` y agrega estas funciones al final (antes de `module.exports`):

```javascript
/**
 * Middleware para verificar rol de owner
 */
function requireOwner(req, res, next) {
  if (req.user && req.user.rol === 'owner') {
    next();
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de owner' });
  }
}

/**
 * Middleware para verificar que el usuario puede acceder a un recurso
 * Owner puede acceder a todo, admin solo a sus propios recursos
 */
function requireOwnerOrSelf(req, res, next) {
  const requestedUserId = parseInt(req.params.id);
  const currentUserId = req.user.userId;
  const currentUserRol = req.user.rol;

  // Owner puede acceder a todo
  if (currentUserRol === 'owner') {
    return next();
  }

  // Admin solo puede acceder a sus propios recursos
  if (currentUserRol === 'admin' && currentUserId === requestedUserId) {
    return next();
  }

  return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
}
```

Y actualiza el `module.exports` al final:

```javascript
module.exports = {
  crearUsuarioAdminPorDefecto,
  login,
  verifyToken,
  authenticateToken,
  requireAdmin,
  requireOwner,
  requireOwnerOrSelf
};
```

---

## 📋 Paso 2: Ejecutar la Migración de Base de Datos

Antes de agregar los endpoints, necesitas ejecutar la migración SQL para agregar los campos necesarios.

### 2.1 Ejecutar el Script SQL

Ejecuta el script SQL que está en:
`test_loera/catalogo-productos-nextjs/migrations/add_user_phone_and_product_owner.sql`

Puedes ejecutarlo directamente en tu base de datos PostgreSQL o usar un cliente como pgAdmin, DBeaver, o la consola de Neon.

**IMPORTANTE**: Después de ejecutar la migración, marca el primer usuario como "owner":

```sql
UPDATE usuarios SET rol = 'owner' WHERE id = 1;
-- O si sabes el email:
UPDATE usuarios SET rol = 'owner' WHERE email = 'admin@catalogo.com';
```

---

## 📋 Paso 3: Agregar Endpoints de Usuarios

Abre el archivo `test_loera/catalogo-productos/services/api/server.js` y agrega estos endpoints **después de las rutas de autenticación** (después de la línea 104, antes de "// Rutas API"):

```javascript
// ========== RUTAS DE USUARIOS ==========

// GET /api/v1/usuarios - Listar todos los usuarios (solo owner)
app.get(`/api/${API_VERSION}/usuarios`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const dbPool = await getPool();
    const result = await dbPool.query(
      'SELECT id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion FROM usuarios ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/v1/usuarios - Crear nuevo usuario administrador (solo owner)
app.post(`/api/${API_VERSION}/usuarios`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const dbPool = await getPool();

    // Verificar que el email no exista
    const emailCheck = await dbPool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario (siempre como admin, no owner)
    const result = await dbPool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, telefono, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion',
      [email.toLowerCase().trim(), passwordHash, nombre.trim(), 'admin', telefono || null, true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/v1/usuarios/:id - Actualizar usuario
app.put(`/api/${API_VERSION}/usuarios/:id`, authenticateToken, requireOwnerOrSelf, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, activo } = req.body;

    const dbPool = await getPool();

    // Verificar que el usuario existe
    const userCheck = await dbPool.query('SELECT id, rol FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingUser = userCheck.rows[0];
    const currentUserRol = req.user.rol;
    const currentUserId = req.user.userId;

    // Si es owner intentando actualizar otro owner, no permitir
    if (currentUserRol === 'owner' && existingUser.rol === 'owner' && existingUser.id !== currentUserId) {
      return res.status(403).json({ error: 'No puedes modificar otro usuario owner' });
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre.trim());
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramIndex++}`);
      values.push(telefono ? telefono.trim() : null);
    }
    if (activo !== undefined && currentUserRol === 'owner') {
      // Solo owner puede cambiar el estado activo
      updates.push(`activo = $${paramIndex++}`);
      values.push(activo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion`;
    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/v1/usuarios/:id - Eliminar usuario (solo owner)
app.delete(`/api/${API_VERSION}/usuarios/:id`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // No permitir eliminar al usuario actual
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const dbPool = await getPool();

    // Verificar que el usuario existe y no es owner
    const userCheck = await dbPool.query('SELECT id, rol FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (userCheck.rows[0].rol === 'owner') {
      return res.status(403).json({ error: 'No se puede eliminar un usuario owner' });
    }

    await dbPool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});
```

**IMPORTANTE**: Necesitas agregar `bcrypt` al inicio del archivo si no está:

```javascript
const bcrypt = require('bcryptjs');
```

Y también necesitas importar los nuevos middlewares de `auth.js`:

```javascript
const { login, verifyToken, authenticateToken, requireAdmin, requireOwner, requireOwnerOrSelf, crearUsuarioAdminPorDefecto } = require('./auth');
```

---

## 📋 Paso 4: Modificar Endpoints de Productos

Ahora necesitamos modificar los endpoints de productos para que:
1. Asignen `usuario_id` al crear productos
2. Filtren por `usuario_id` para admins
3. Incluyan `usuario_telefono` en las respuestas

### 4.1 Modificar la función `convertirProducto`

Busca la función `convertirProducto` (alrededor de la línea 109) y modifícala para incluir el teléfono del usuario:

```javascript
async function convertirProducto(producto) {
  try {
    const precio = typeof producto.precio === 'string' 
      ? parseFloat(producto.precio) 
      : Number(producto.precio);
    
    let imagenes = [];
    try {
      const dbPool = await getPool();
      const imagenesResult = await dbPool.query(
        'SELECT imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden, id',
        [producto.id]
      );
      imagenes = imagenesResult.rows.map(row => row.imagen_url);
    } catch (imgError) {
      console.warn(`⚠️  Error obteniendo imágenes para producto ${producto.id}:`, imgError.message);
      imagenes = [];
    }

    // Obtener teléfono del usuario propietario
    let usuarioTelefono = null;
    if (producto.usuario_id) {
      try {
        const dbPool = await getPool();
        const usuarioResult = await dbPool.query(
          'SELECT telefono FROM usuarios WHERE id = $1',
          [producto.usuario_id]
        );
        if (usuarioResult.rows.length > 0) {
          usuarioTelefono = usuarioResult.rows[0].telefono;
        }
      } catch (userError) {
        console.warn(`⚠️  Error obteniendo teléfono del usuario para producto ${producto.id}:`, userError.message);
      }
    }
    
    return {
      id: parseInt(producto.id),
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: precio,
      stock: parseInt(producto.stock) || 0,
      imagen_url: producto.imagen_url || null,
      imagenes: imagenes,
      usuario_id: producto.usuario_id ? parseInt(producto.usuario_id) : undefined,
      usuario_telefono: usuarioTelefono,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };
  } catch (error) {
    console.error('Error en convertirProducto:', error);
    return {
      id: parseInt(producto.id),
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: typeof producto.precio === 'string' ? parseFloat(producto.precio) : Number(producto.precio) || 0,
      stock: parseInt(producto.stock) || 0,
      imagen_url: producto.imagen_url || null,
      imagenes: [],
      usuario_id: producto.usuario_id ? parseInt(producto.usuario_id) : undefined,
      usuario_telefono: null,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };
  }
}
```

### 4.2 Modificar GET /api/v1/productos

Busca el endpoint `GET /api/v1/productos` (alrededor de la línea 160) y modifícalo:

```javascript
// GET /api/v1/productos - Obtener todos los productos
app.get(`/api/${API_VERSION}/productos`, authenticateToken, async (req, res) => {
  try {
    const dbPool = await getPool();
    const currentUserRol = req.user.rol;
    const currentUserId = req.user.userId;

    let query;
    let params = [];

    // Si es admin, solo ver sus productos. Si es owner, ver todos
    if (currentUserRol === 'admin') {
      query = 'SELECT * FROM productos WHERE usuario_id = $1 ORDER BY id';
      params = [currentUserId];
    } else {
      query = 'SELECT * FROM productos ORDER BY id';
    }

    const result = await dbPool.query(query, params);
    const productos = await Promise.all(result.rows.map(convertirProducto));
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message
    });
  }
});
```

**NOTA**: Si quieres que el endpoint público (sin autenticación) también funcione, puedes crear una versión separada o hacer que la autenticación sea opcional. Por ahora, asumimos que todos los endpoints requieren autenticación.

### 4.3 Modificar POST /api/v1/productos

Busca el endpoint `POST /api/v1/productos` (alrededor de la línea 280) y modifícalo para asignar `usuario_id`:

```javascript
// POST /api/v1/productos - Crear un nuevo producto (requiere autenticación)
app.post(`/api/${API_VERSION}/productos`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen_url, imagenes } = req.body;
    const currentUserId = req.user.userId; // ID del usuario actual
    
    console.log('📥 POST /productos - Datos recibidos:', { nombre, precio, imagenes: imagenes?.length || 0 });
    
    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    // Insertar producto con usuario_id
    console.log('💾 Insertando producto en BD...');
    const dbPool = await getPool();
    const result = await dbPool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        nombre.trim(), 
        descripcion ? descripcion.trim() : '', 
        parseFloat(precio), 
        stock !== undefined ? parseInt(stock) : 0,
        imagen_url ? imagen_url.trim() : null,
        currentUserId // Asignar usuario_id automáticamente
      ]
    );
    
    const productoId = result.rows[0].id;
    console.log(`✅ Producto creado con ID: ${productoId}`);
    
    // ... resto del código de imágenes permanece igual ...
    
    const productoConvertido = await convertirProducto(result.rows[0]);
    console.log('✅ Producto creado exitosamente con ID:', productoConvertido.id);
    res.status(201).json(productoConvertido);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({ 
      error: 'Error al crear producto', 
      details: error.message
    });
  }
});
```

### 4.4 Modificar PUT /api/v1/productos/:id

Busca el endpoint `PUT /api/v1/productos/:id` (alrededor de la línea 342) y agrega verificación de permisos:

```javascript
// PUT /api/v1/productos/:id - Actualizar un producto (requiere autenticación)
app.put(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, precio, stock, imagen_url, imagenes } = req.body;
    const currentUserId = req.user.userId;
    const currentUserRol = req.user.rol;
    
    const dbPool = await getPool();

    // Verificar que el producto existe y permisos
    const productoCheck = await dbPool.query('SELECT usuario_id FROM productos WHERE id = $1', [id]);
    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si es admin, solo puede editar sus propios productos
    if (currentUserRol === 'admin' && productoCheck.rows[0].usuario_id !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para editar este producto' });
    }

    // ... resto del código de actualización permanece igual ...
    
    res.json(await convertirProducto(result.rows[0]));
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});
```

### 4.5 Modificar DELETE /api/v1/productos/:id

Busca el endpoint `DELETE /api/v1/productos/:id` (alrededor de la línea 414) y agrega verificación de permisos:

```javascript
// DELETE /api/v1/productos/:id - Eliminar un producto (requiere autenticación)
app.delete(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dbPool = await getPool();
    const id = parseInt(req.params.id);
    const currentUserId = req.user.userId;
    const currentUserRol = req.user.rol;

    // Verificar que el producto existe y permisos
    const productoCheck = await dbPool.query('SELECT usuario_id FROM productos WHERE id = $1', [id]);
    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si es admin, solo puede eliminar sus propios productos
    if (currentUserRol === 'admin' && productoCheck.rows[0].usuario_id !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este producto' });
    }

    await dbPool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});
```

---

## 📋 Paso 5: Actualizar requireAdmin para permitir owner

Modifica el middleware `requireAdmin` en `auth.js` para que también permita a los owners:

```javascript
function requireAdmin(req, res, next) {
  if (req.user && (req.user.rol === 'admin' || req.user.rol === 'owner')) {
    next();
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
}
```

---

## 📋 Paso 6: Actualizar el Login para incluir teléfono

Modifica la función `login` en `auth.js` para incluir el teléfono en la respuesta:

```javascript
async function login(email, password) {
  try {
    const dbPool = await getPool();
    const result = await dbPool.query(
      'SELECT id, email, password_hash, nombre, rol, telefono, activo FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // ... resto del código de verificación ...

    return {
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        telefono: usuario.telefono // Agregar teléfono
      }
    };
  } catch (error) {
    throw error;
  }
}
```

---

## 📋 Paso 7: Reiniciar el Servidor

Después de hacer todos los cambios:

1. Guarda todos los archivos
2. Reinicia el servidor backend:
   ```bash
   cd test_loera/catalogo-productos/services/api
   npm start
   # o si usas nodemon:
   npm run dev
   ```

---

## ✅ Verificación

Para verificar que todo funciona:

1. **Probar actualizar perfil**: Intenta actualizar tu teléfono en el frontend
2. **Probar crear usuario** (como owner): Ve a "Gestión de Usuarios" y crea un nuevo admin
3. **Probar crear producto**: Crea un producto y verifica que se asigne tu `usuario_id`
4. **Probar filtrado**: Si eres admin, solo deberías ver tus propios productos

---

## 🐛 Solución de Problemas

- **Error 404**: Verifica que el servidor esté corriendo en el puerto correcto (3001)
- **Error de permisos**: Verifica que tu usuario tenga rol "owner" en la base de datos
- **Error de base de datos**: Verifica que ejecutaste la migración SQL correctamente

