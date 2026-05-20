const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema({
  nombreTarea: { type: String, required: true, trim: true },
  descripcion: { type: String },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  estadoTarea: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  porcentajeAvanceTarea: { type: Number, default: 0, min: 0, max: 100 },
  meta: { type: mongoose.Schema.Types.ObjectId, ref: 'Meta', required: true }
});

module.exports = mongoose.model('Tarea', tareaSchema);