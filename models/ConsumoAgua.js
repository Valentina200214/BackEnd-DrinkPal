const mongoose = require('mongoose');

const consumoAguaSchema = new mongoose.Schema({
  usuarioFinal: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaHora: { type: Date, default: Date.now },
  consumoInstante: { type: Number, required: true }, // en ml o la unidad que manejes
  racha: { type: Number, default: 0}
});

module.exports = mongoose.model('ConsumoAgua', consumoAguaSchema);