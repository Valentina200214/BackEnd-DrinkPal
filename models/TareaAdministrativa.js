const mongoose = require('mongoose');

const tareaAdminSchema = new mongoose.Schema({
  nombreTarea: { type: String, required: true, trim: true },
  descripcion: { type: String },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  estadoTarea: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  usuarioAdministrativo: { type: mongoose.Schema.Types.ObjectId, ref: 'UsuarioAdministrativo', required: true },
  rolCargo: { type: String, trim: true } // rol/cargo que aparece en el ERD
});

module.exports = mongoose.model('TareaAdministrativa', tareaAdminSchema);