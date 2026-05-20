const mongoose = require('mongoose');

const rolSchema = new mongoose.Schema({
  cargo: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // Ej: 'admin', 'usuario', 'editor'
  }
});

module.exports = mongoose.model('Rol', rolSchema);