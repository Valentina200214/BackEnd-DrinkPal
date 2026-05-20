const mongoose = require('mongoose');

const avanceMetaSchema = new mongoose.Schema({
  meta: { type: mongoose.Schema.Types.ObjectId, ref: 'Meta', required: true },
  porcentajeAvanceMeta: { type: Number, required: true, min: 0, max: 100 },
  usuarioFinal: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaConsulta: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AvanceMeta', avanceMetaSchema);