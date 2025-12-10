# Resumen de Cambios para Implementar Endpoints de Usuarios

## ✅ Archivos Modificados

### 1. `auth.js` ✅ COMPLETADO
- ✅ Agregado campo `telefono` en la consulta de login
- ✅ Agregado `telefono` en la respuesta del login
- ✅ Modificado `requireAdmin` para permitir también a owners
- ✅ Agregado middleware `requireOwner`
- ✅ Agregado middleware `requireOwnerOrSelf`

### 2. `server.js` - PENDIENTE
Necesitas agregar:

1. **Importar bcrypt** (si no está):
   ```javascript
   const bcrypt = require('bcryptjs');
   ```

2. **Actualizar imports de auth.js**:
   ```javascript
   const { login, verifyToken, authenticateToken, requireAdmin, requireOwner, requireOwnerOrSelf, crearUsuarioAdminPorDefecto } = require('./auth');
   ```

3. **Agregar endpoints de usuarios**:
   - Copia el contenido de `endpoints-usuarios.js` y pégalo después de las rutas de autenticación (después de la línea 104)

4. **Modificar función `convertirProducto`**:
   - Agregar lógica para obtener `usuario_telefono`
   - Agregar `usuario_id` y `usuario_telefono` al objeto retornado

5. **Modificar GET /api/v1/productos**:
   - Agregar autenticación
   - Filtrar por `usuario_id` si el usuario es admin

6. **Modificar POST /api/v1/productos**:
   - Asignar `usuario_id` automáticamente al crear producto

7. **Modificar PUT /api/v1/productos/:id**:
   - Verificar permisos (owner puede editar todo, admin solo sus productos)

8. **Modificar DELETE /api/v1/productos/:id**:
   - Verificar permisos (owner puede eliminar todo, admin solo sus productos)

## 📋 Pasos Siguientes

1. **Ejecutar migración SQL**:
   - Ejecuta el archivo `test_loera/catalogo-productos-nextjs/migrations/add_user_phone_and_product_owner.sql` en tu base de datos

2. **Marcar primer usuario como owner**:
   ```sql
   UPDATE usuarios SET rol = 'owner' WHERE id = 1;
   ```

3. **Aplicar cambios en server.js**:
   - Sigue la guía en `GUIA_IMPLEMENTACION_USUARIOS.md`

4. **Reiniciar el servidor**:
   ```bash
   cd test_loera/catalogo-productos/services/api
   npm start
   ```

## 📝 Notas Importantes

- El archivo `endpoints-usuarios.js` contiene el código listo para copiar y pegar
- La guía completa está en `GUIA_IMPLEMENTACION_USUARIOS.md`
- Todos los cambios están documentados paso a paso

