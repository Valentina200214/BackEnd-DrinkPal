const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema({
  nombreMeta: { type: String, required: true, trim: true },
  descripcion: { type: String },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  estadoMeta: {
    type: String,
    enum: ['activa', 'completada', 'cancelada'],
    default: 'activa'
  },
  porcentajeAvanceMeta: { type: Number, default: 0, min: 0, max: 100 }
});

module.exports = mongoose.model('Meta', metaSchema);