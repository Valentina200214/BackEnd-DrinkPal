const Tarea = require('../models/Tarea');

// Crear tarea
const crearTarea = async (datos) => {
  try {
    if (!datos.nombreTarea) return 'El nombre de la tarea es obligatorio';
    if (!datos.fechaInicio)  return 'La fecha de inicio es obligatoria';
    if (!datos.meta)         return 'El ID de la meta es obligatorio';

    const nueva = new Tarea(datos);
    return await nueva.save();
  } catch (error) {
    return error.message;
  }
};

// Obtener todas las tareas (con datos de la meta)
const obtenerTareas = async () => {
  try {
    return await Tarea.find().populate('meta', 'nombreMeta estadoMeta');
  } catch (error) {
    return error.message;
  }
};

// Obtener una tarea por ID
const obtenerTareaPorId = async (id) => {
  try {
    const tarea = await Tarea.findById(id).populate('meta');
    if (!tarea) return 'Tarea no encontrada';
    return tarea;
  } catch (error) {
    return error.message;
  }
};

// Obtener tareas por meta
const obtenerTareasPorMeta = async (idMeta) => {
  try {
    return await Tarea.find({ meta: idMeta }).populate('meta', 'nombreMeta');
  } catch (error) {
    return error.message;
  }
};

// Actualizar tarea
const actualizarTarea = async (id, datos) => {
  try {
    const actualizada = await Tarea.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    if (!actualizada) return 'Tarea no encontrada';
    return actualizada;
  } catch (error) {
    return error.message;
  }
};

// Eliminar tarea
const eliminarTarea = async (id) => {
  try {
    const eliminada = await Tarea.findByIdAndDelete(id);
    if (!eliminada) return 'Tarea no encontrada';
    return 'Tarea eliminada correctamente';
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  crearTarea,
  obtenerTareas,
  obtenerTareaPorId,
  obtenerTareasPorMeta,
  actualizarTarea,
  eliminarTarea,
};