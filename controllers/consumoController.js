const ConsumoAgua = require('../models/ConsumoAgua');
const Usuario     = require('../models/Usuario');

// Registrar un consumo — guarda la racha actual en el registro
const registrarConsumo = async (datos) => {
  try {
    if (!datos.usuarioFinal)            return 'El ID del usuario es obligatorio';
    if (datos.consumoInstante === undefined) return 'El consumo instantáneo es obligatorio';

    // 1. Guardar el consumo (racha en 0 de momento)
    const nuevo   = new ConsumoAgua(datos);
    const guardado = await nuevo.save();

    // 2. Obtener la meta del usuario
    const usuario = await Usuario.findById(datos.usuarioFinal).select('metaConsumoMl racha');
    const meta    = (usuario && usuario.metaConsumoMl > 0) ? usuario.metaConsumoMl : 2000;

    // 3. Calcular racha con el nuevo consumo ya incluido en DB
    const { racha } = await calcularRacha(datos.usuarioFinal, meta);

    // 4. Actualizar el registro con la racha correcta
    guardado.racha = racha;
    await guardado.save();

    // 5. Actualizar la racha en el modelo de usuario
    if (usuario) {
      await Usuario.findByIdAndUpdate(datos.usuarioFinal, { racha });
    }

    return guardado;
  } catch (error) {
    return error.message;
  }
};

// Obtener todos los consumos
const obtenerConsumos = async () => {
  try {
    return await ConsumoAgua.find().populate('usuarioFinal', 'nombre correo');
  } catch (error) {
    return error.message;
  }
};

// Obtener consumos de un usuario específico
const obtenerConsumosPorUsuario = async (idUsuario) => {
  try {
    return await ConsumoAgua.find({ usuarioFinal: idUsuario })
      .populate('usuarioFinal', 'nombre correo')
      .sort({ fechaHora: -1 }); // más recientes primero
  } catch (error) {
    return error.message;
  }
};

// Obtener consumo por ID
const obtenerConsumoPorId = async (id) => {
  try {
    const consumo = await ConsumoAgua.findById(id).populate('usuarioFinal', 'nombre correo');
    if (!consumo) return 'Consumo no encontrado';
    return consumo;
  } catch (error) {
    return error.message;
  }
};

// Eliminar consumo
const eliminarConsumo = async (id) => {
  try {
    const eliminado = await ConsumoAgua.findByIdAndDelete(id);
    if (!eliminado) return 'Consumo no encontrado';
    return 'Consumo eliminado correctamente';
  } catch (error) {
    return error.message;
  }
};

// Calcular racha actual del usuario
const calcularRacha = async (idUsuario, metaDiaria = 2000) => {
  try {
    const consumos = await ConsumoAgua.find({ usuarioFinal: idUsuario });

    // Agrupar consumos por día (clave: "YYYY-MM-DD")
    const porDia = {};
    consumos.forEach(c => {
      const d   = new Date(c.fechaHora);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      porDia[key] = (porDia[key] || 0) + c.consumoInstante;
    });

    let racha = 0;
    const hoy = new Date();

    for (let i = 0; i <= 365; i++) {
      const d   = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      const key      = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const totalDia = porDia[key] || 0;

      if (totalDia >= metaDiaria) {
        racha++; // Este día cumplió la meta → suma a la racha
      } else if (i === 0) {
        continue; // Hoy aún no se ha completado → no rompe la racha, revisa desde ayer
      } else {
        break; // Día pasado sin meta → racha se rompe
      }
    }

    return { racha };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  registrarConsumo,
  obtenerConsumos,
  obtenerConsumosPorUsuario,
  obtenerConsumoPorId,
  eliminarConsumo,
  calcularRacha,
};
