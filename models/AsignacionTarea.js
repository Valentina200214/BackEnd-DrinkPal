const mongoose = require('mongoose');

const asignacionTareaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', required: true },
  fechaAsignacion: { type: Date, default: Date.now },
  fechaFinalizacion: { type: Date },
  estadoTarea: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    default: 'pendiente'
  }
});

module.exports = mongoose.model('AsignacionTarea', asignacionTareaSchema);