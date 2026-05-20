const AvanceMeta = require('../models/AvanceMeta');
const Meta       = require('../models/Meta');

// Registrar avance de meta (solo se crea, no se edita — es historial)
const registrarAvanceMeta = async (datos) => {
  try {
    if (!datos.meta)                         return 'El ID de la meta es obligatorio';
    if (!datos.usuarioFinal)                 return 'El ID del usuario es obligatorio';
    if (datos.porcentajeAvanceMeta === undefined) return 'El porcentaje de avance es obligatorio';

    const nuevo = new AvanceMeta(datos);
    const guardado = await nuevo.save();

    // Actualizar automáticamente porcentajeAvanceMeta en el documento Meta
    await Meta.findByIdAndUpdate(datos.meta, {
      porcentajeAvanceMeta: datos.porcentajeAvanceMeta
    });

    return guardado;
  } catch (error) {
    return error.message;
  }
};

// Obtener todo el historial de avances de metas
const obtenerAvancesMeta = async () => {
  try {
    return await AvanceMeta.find()
      .populate('meta', 'nombreMeta estadoMeta')
      .populate('usuarioFinal', 'nombre correo')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

// Obtener historial de avances de una meta específica
const obtenerAvancesPorMeta = async (idMeta) => {
  try {
    return await AvanceMeta.find({ meta: idMeta })
      .populate('usuarioFinal', 'nombre correo')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

// Obtener historial de avances por usuario
const obtenerAvancesPorUsuario = async (idUsuario) => {
  try {
    return await AvanceMeta.find({ usuarioFinal: idUsuario })
      .populate('meta', 'nombreMeta estadoMeta porcentajeAvanceMeta')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  registrarAvanceMeta,
  obtenerAvancesMeta,
  obtenerAvancesPorMeta,
  obtenerAvancesPorUsuario,
};