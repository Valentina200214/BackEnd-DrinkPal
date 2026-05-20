const mongoose = require('mongoose');

const usuarioAdminSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  clave: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now },
  rol: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol', required: true }
});

module.exports = mongoose.model('UsuarioAdministrativo', usuarioAdminSchema);