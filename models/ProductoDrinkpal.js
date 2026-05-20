const mongoose = require('mongoose');

// Cada documento representa un producto físico DrinkPal.
// El campo `usado` indica si ese id_producto ya fue usado para registrar un usuario.
const productoDrinkpalSchema = new mongoose.Schema({
  id_producto: {
    type: String,
    required: true,
    unique: true,   // No pueden existir dos productos con el mismo id
    trim: true
  },
  usado: {
    type: Boolean,
    default: false  // false = disponible para registro, true = ya fue utilizado
  },
  fechaRegistro: {
    type: Date        // Se llena cuando alguien lo usa para registrarse
  }
});

module.exports = mongoose.model('ProductoDrinkpal', productoDrinkpalSchema);
