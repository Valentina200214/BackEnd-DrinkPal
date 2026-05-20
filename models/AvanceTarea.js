const mongoose = require('mongoose');

const avanceTareaSchema = new mongoose.Schema({
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', required: true },
  porcentajeAvanceTarea: { type: Number, required: true, min: 0, max: 100 },
  usuarioFinal: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaConsulta: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AvanceTarea', avanceTareaSchema);