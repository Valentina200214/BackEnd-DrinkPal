const Usuario        = require('../models/Usuario');
const ProductoDrinkpal = require('../models/ProductoDrinkpal');
const jwt            = require('jsonwebtoken');
const bcrypt         = require('bcryptjs');

// Consultar todos los usuarios
obtenerUsuarios = async (datos) => {
  try {
    const usuarios = await Usuario.find();
    return usuarios;
  } catch (error) {
    return error;
  }
};

// Buscar por correo
getcorreoUsuarios = async (datos) => {
  try {
    const usuarios = await Usuario.find(datos);
    return usuarios;
  } catch (error) {
    return error;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// CREAR USUARIO  (registro con llave de producto)
// ──────────────────────────────────────────────────────────────────────────────
crearUsuario = async (datos) => {
  try {
    // 1. Validaciones básicas de campos obligatorios
    if (!datos.correo)      return { error: 'El correo es obligatorio' };
    if (!datos.clave)       return { error: 'La clave es obligatoria' };
    if (!datos.id_producto) return { error: 'El ID de producto es obligatorio' };

    // 2. Buscar el producto en la base de datos
    const producto = await ProductoDrinkpal.findOne({ id_producto: datos.id_producto });

    if (!producto) {
      // El id_producto no existe en ningún producto registrado
      return { error: 'ID de producto inválido. Verifica el código en tu dispositivo DrinkPal.' };
    }

    if (producto.usado) {
      // El producto ya fue usado para registrar otro usuario
      return { error: 'Este ID de producto ya fue utilizado para registrar una cuenta.' };
    }

    // 3. Verificar que el correo no esté ya registrado
    const correoExistente = await Usuario.findOne({ correo: datos.correo });
    if (correoExistente) {
      return { error: 'Ya existe una cuenta con ese correo electrónico.' };
    }

    // 4. Encriptar la clave
    const salt = await bcrypt.genSalt(10);
    datos.clave = await bcrypt.hash(datos.clave, salt);

    // 5. Crear y guardar el usuario
    const nuevoUsuario = new Usuario(datos);
    const respuesta = await nuevoUsuario.save();

    // 6. Marcar el producto como "usado" para que no pueda usarse de nuevo
    await ProductoDrinkpal.findByIdAndUpdate(producto._id, {
      usado: true,
      fechaRegistro: new Date()
    });

    return { ok: true, usuario: respuesta };

  } catch (error) {
    return { error: error.message };
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────────────────────

login = async (datos) => {
  const { correo, clave } = datos;

  try {
    let usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return { error: 'Credenciales incorrectas' };
    }

    const esValida = await bcrypt.compare(clave, usuario.clave);

    if (!esValida) {
      return { error: 'Credenciales incorrectas' };
    }

    const payload = {
      usuario: {
        id: usuario.id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    // DEVOLVER TOKEN + _id
    return {
      token,
      _id: usuario._id,
      correo: usuario.correo
    };

  } catch (error) {
    return { error: 'Error en el servidor' };
  }
};


module.exports = {
  obtenerUsuarios,
  crearUsuario,
  getcorreoUsuarios,
  login
};
