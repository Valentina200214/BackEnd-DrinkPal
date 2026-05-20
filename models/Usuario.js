const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  correo: {
    type: String, required: [true, 'El correo es obligatorio'],
    unique: true, lowercase: true, trim: true
  },
  clave:     { type: String, required: [true, 'La clave es obligatoria'] },
  nombre:    { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
  id_producto:    { type: String, required: [true, 'El ID del producto es obligatorio'], trim: true },
  telefono:  { type: String, trim: true },
  localidad: { type: String, trim: true },
  rol: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol', required: true , default: new mongoose.Types.ObjectId('69fe629afa981d9ca83a82f6') },

  metaConsumoMl: {
    type: Number,
    default: 0,
    min: [0, 'La meta no puede ser negativa']
  },

  // Racha actual del usuario (días consecutivos cumpliendo la meta)
  // Se actualiza automáticamente al registrar cada consumo
  racha: {
    type: Number,
    default: 0,
    min: [0, 'La racha no puede ser negativa']
  },

  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
