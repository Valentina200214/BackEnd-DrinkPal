const Meta = require('../models/Meta');

const crearMeta = async (datos) => {
  try {
    const nueva = new Meta(datos);
    return await nueva.save();
  } catch (error) {
    return error.message;
  }
};

const obtenerMetas = async () => {
  try {
    return await Meta.find();
  } catch (error) {
    return error.message;
  }
};

const actualizarMeta = async (id, datos) => {
  try {
    return await Meta.findByIdAndUpdate(id, datos, { new: true });
  } catch (error) {
    return error.message;
  }
};

const eliminarMeta = async (id) => {
  try {
    return await Meta.findByIdAndDelete(id);
  } catch (error) {
    return error.message;
  }
};

module.exports = { crearMeta, obtenerMetas, actualizarMeta, eliminarMeta };