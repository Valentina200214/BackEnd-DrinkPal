const TareaAdministrativa = require('../models/TareaAdministrativa');

// Crear tarea administrativa
const crearTareaAdmin = async (datos) => {
  try {
    if (!datos.nombreTarea)            return 'El nombre de la tarea es obligatorio';
    if (!datos.fechaInicio)            return 'La fecha de inicio es obligatoria';
    if (!datos.usuarioAdministrativo)  return 'El ID del usuario administrativo es obligatorio';

    const nueva = new TareaAdministrativa(datos);
    return await nueva.save();
  } catch (error) {
    return error.message;
  }
};

// Obtener todas las tareas administrativas
const obtenerTareasAdmin = async () => {
  try {
    return await TareaAdministrativa.find()
      .populate('usuarioAdministrativo', 'nombre rol');
  } catch (error) {
    return error.message;
  }
};

// Obtener tarea administrativa por ID
const obtenerTareaAdminPorId = async (id) => {
  try {
    const tarea = await TareaAdministrativa.findById(id)
      .populate('usuarioAdministrativo', 'nombre rol');
    if (!tarea) return 'Tarea administrativa no encontrada';
    return tarea;
  } catch (error) {
    return error.message;
  }
};

// Obtener tareas por usuario administrativo
const obtenerTareasAdminPorUsuario = async (idUsuarioAdmin) => {
  try {
    return await TareaAdministrativa.find({ usuarioAdministrativo: idUsuarioAdmin })
      .populate('usuarioAdministrativo', 'nombre');
  } catch (error) {
    return error.message;
  }
};

// Actualizar tarea administrativa
const actualizarTareaAdmin = async (id, datos) => {
  try {
    const actualizada = await TareaAdministrativa.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    if (!actualizada) return 'Tarea administrativa no encontrada';
    return actualizada;
  } catch (error) {
    return error.message;
  }
};

// Eliminar tarea administrativa
const eliminarTareaAdmin = async (id) => {
  try {
    const eliminada = await TareaAdministrativa.findByIdAndDelete(id);
    if (!eliminada) return 'Tarea administrativa no encontrada';
    return 'Tarea administrativa eliminada correctamente';
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  crearTareaAdmin,
  obtenerTareasAdmin,
  obtenerTareaAdminPorId,
  obtenerTareasAdminPorUsuario,
  actualizarTareaAdmin,
  eliminarTareaAdmin,
};