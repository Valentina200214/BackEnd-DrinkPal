const AvanceTarea = require('../models/AvanceTarea');
const Tarea       = require('../models/Tarea');

// Registrar avance de tarea (solo se crea, no se edita — es historial)
const registrarAvanceTarea = async (datos) => {
  try {
    if (!datos.tarea)                          return 'El ID de la tarea es obligatorio';
    if (!datos.usuarioFinal)                   return 'El ID del usuario es obligatorio';
    if (datos.porcentajeAvanceTarea === undefined) return 'El porcentaje de avance es obligatorio';

    const nuevo = new AvanceTarea(datos);
    const guardado = await nuevo.save();

    // Actualizar automáticamente porcentajeAvanceTarea en el documento Tarea
    await Tarea.findByIdAndUpdate(datos.tarea, {
      porcentajeAvanceTarea: datos.porcentajeAvanceTarea
    });

    return guardado;
  } catch (error) {
    return error.message;
  }
};

// Obtener todo el historial de avances de tareas
const obtenerAvancesTarea = async () => {
  try {
    return await AvanceTarea.find()
      .populate('tarea', 'nombreTarea estadoTarea')
      .populate('usuarioFinal', 'nombre correo')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

// Obtener historial de avances de una tarea específica
const obtenerAvancesPorTarea = async (idTarea) => {
  try {
    return await AvanceTarea.find({ tarea: idTarea })
      .populate('usuarioFinal', 'nombre correo')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

// Obtener historial de avances por usuario
const obtenerAvancesPorUsuario = async (idUsuario) => {
  try {
    return await AvanceTarea.find({ usuarioFinal: idUsuario })
      .populate('tarea', 'nombreTarea estadoTarea porcentajeAvanceTarea')
      .sort({ fechaConsulta: -1 });
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  registrarAvanceTarea,
  obtenerAvancesTarea,
  obtenerAvancesPorTarea,
  obtenerAvancesPorUsuario,
};