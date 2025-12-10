// ========== RUTAS DE USUARIOS ==========
// Copia este código y pégalo en server.js después de las rutas de autenticación
// (después de la línea 104, antes de "// Rutas API")

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

