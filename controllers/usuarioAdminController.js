const UsuarioAdministrativo = require('../models/UsuarioAdministrativo');
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Crear usuario administrativo
const crearUsuarioAdmin = async (datos) => {
  try {
    if (!datos.nombre) return 'El nombre es obligatorio';
    if (!datos.clave)  return 'La clave es obligatoria';
    if (!datos.rol)    return 'El rol es obligatorio';

    const salt = await bcrypt.genSalt(10);
    datos.clave = await bcrypt.hash(datos.clave, salt);

    const nuevo = new UsuarioAdministrativo(datos);
    return await nuevo.save();
  } catch (error) {
    return error.message;
  }
};

// Obtener todos los usuarios administrativos
const obtenerUsuariosAdmin = async () => {
  try {
    // No retornar el campo clave por seguridad
    return await UsuarioAdministrativo.find().select('-clave').populate('rol', 'cargo');
  } catch (error) {
    return error.message;
  }
};

// Obtener un usuario administrativo por ID
const obtenerUsuarioAdminPorId = async (id) => {
  try {
    const usuario = await UsuarioAdministrativo.findById(id).select('-clave').populate('rol', 'cargo');
    if (!usuario) return 'Usuario administrativo no encontrado';
    return usuario;
  } catch (error) {
    return error.message;
  }
};

// Actualizar usuario administrativo
const actualizarUsuarioAdmin = async (id, datos) => {
  try {
    // Si viene una nueva clave, encriptarla
    if (datos.clave) {
      const salt = await bcrypt.genSalt(10);
      datos.clave = await bcrypt.hash(datos.clave, salt);
    }
    const actualizado = await UsuarioAdministrativo.findByIdAndUpdate(id, datos, { new: true, runValidators: true }).select('-clave');
    if (!actualizado) return 'Usuario administrativo no encontrado';
    return actualizado;
  } catch (error) {
    return error.message;
  }
};

// Eliminar usuario administrativo
const eliminarUsuarioAdmin = async (id) => {
  try {
    const eliminado = await UsuarioAdministrativo.findByIdAndDelete(id);
    if (!eliminado) return 'Usuario administrativo no encontrado';
    return 'Usuario administrativo eliminado correctamente';
  } catch (error) {
    return error.message;
  }
};

// Login de usuario administrativo (genera su propio token JWT)
const loginAdmin = async (datos) => {
  const { nombre, clave } = datos;
  try {
    if (!nombre) return 'El nombre es obligatorio';
    if (!clave)  return 'La clave es obligatoria';

    const usuario = await UsuarioAdministrativo.findOne({ nombre });
    if (!usuario) return 'Usuario administrativo no encontrado';

    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) return 'Clave incorrecta';

    const payload = { usuarioAdmin: { id: usuario.id, rol: usuario.rol } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    return token;
  } catch (error) {
    return 'Error en el servidor';
  }
};

module.exports = {
  crearUsuarioAdmin,
  obtenerUsuariosAdmin,
  obtenerUsuarioAdminPorId,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  loginAdmin,
};