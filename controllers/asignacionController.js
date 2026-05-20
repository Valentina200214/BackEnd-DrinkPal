const AsignacionTarea = require('../models/AsignacionTarea');

// Crear asignación
const crearAsignacion = async (datos) => {
  try {
    if (!datos.usuario) return 'El ID del usuario es obligatorio';
    if (!datos.tarea)   return 'El ID de la tarea es obligatorio';

    // Evitar duplicados: un usuario no puede tener la misma tarea asignada dos veces
    const existe = await AsignacionTarea.findOne({ usuario: datos.usuario, tarea: datos.tarea });
    if (existe) return 'Esta tarea ya está asignada a ese usuario';

    const nueva = new AsignacionTarea(datos);
    return await nueva.save();
  } catch (error) {
    return error.message;
  }
};

// Obtener todas las asignaciones
const obtenerAsignaciones = async () => {
  try {
    return await AsignacionTarea.find()
      .populate('usuario', 'nombre correo')
      .populate('tarea', 'nombreTarea estadoTarea');
  } catch (error) {
    return error.message;
  }
};

// Obtener asignaciones de un usuario
const obtenerAsignacionesPorUsuario = async (idUsuario) => {
  try {
    return await AsignacionTarea.find({ usuario: idUsuario })
      .populate('tarea', 'nombreTarea descripcion estadoTarea fechaFin');
  } catch (error) {
    return error.message;
  }
};

// Obtener asignación por ID
const obtenerAsignacionPorId = async (id) => {
  try {
    const asignacion = await AsignacionTarea.findById(id)
      .populate('usuario', 'nombre correo')
      .populate('tarea');
    if (!asignacion) return 'Asignación no encontrada';
    return asignacion;
  } catch (error) {
    return error.message;
  }
};

// Actualizar asignación (estado, fechaFinalizacion)
const actualizarAsignacion = async (id, datos) => {
  try {
    const actualizada = await AsignacionTarea.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    if (!actualizada) return 'Asignación no encontrada';
    return actualizada;
  } catch (error) {
    return error.message;
  }
};

// Eliminar asignación
const eliminarAsignacion = async (id) => {
  try {
    const eliminada = await AsignacionTarea.findByIdAndDelete(id);
    if (!eliminada) return 'Asignación no encontrada';
    return 'Asignación eliminada correctamente';
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  crearAsignacion,
  obtenerAsignaciones,
  obtenerAsignacionesPorUsuario,
  obtenerAsignacionPorId,
  actualizarAsignacion,
  eliminarAsignacion,
};