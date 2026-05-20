const Usuario         = require('./models/Usuario');
const ConsumoAgua     = require('./models/ConsumoAgua');
const AsignacionTarea = require('./models/AsignacionTarea');
const Meta            = require('./models/Meta');

function inicioDia(fecha = new Date()) {
  const d = new Date(fecha); d.setHours(0, 0, 0, 0); return d;
}
function finDia(fecha = new Date()) {
  const d = new Date(fecha); d.setHours(23, 59, 59, 999); return d;
}
function lunesDeSemana(hoy = new Date()) {
  const d = new Date(hoy);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// SERVICIO 1 — Guardar meta de consumo diario (mL)
const guardarMetaConsumo = async (idUsuario, datos) => {
  try {
    const { metaConsumoMl } = datos;
    if (metaConsumoMl === undefined || metaConsumoMl === null)
      return { error: 'Debes enviar metaConsumoMl' };
    if (isNaN(metaConsumoMl) || Number(metaConsumoMl) <= 0)
      return { error: 'metaConsumoMl debe ser un número mayor a 0' };
    const usuario = await Usuario.findByIdAndUpdate(
      idUsuario, { metaConsumoMl: Number(metaConsumoMl) }, { new: true }
    ).select('nombre correo metaConsumoMl');
    if (!usuario) return { error: 'Usuario no encontrado' };
    return { msg: 'Meta de consumo diario guardada correctamente', usuario: usuario.nombre, metaConsumoMl: usuario.metaConsumoMl };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 2 — Resumen entre dos fechas
const resumenPorPeriodo = async (idUsuario, datos) => {
  try {
    const { fechaInicio, fechaFin } = datos;
    if (!fechaInicio || !fechaFin) return { error: 'Debes enviar fechaInicio y fechaFin (YYYY-MM-DD)' };
    const inicio = new Date(fechaInicio); inicio.setHours(0, 0, 0, 0);
    const fin    = new Date(fechaFin);   fin.setHours(23, 59, 59, 999);
    if (isNaN(inicio) || isNaN(fin)) return { error: 'Formato inválido. Usa YYYY-MM-DD' };
    if (inicio > fin) return { error: 'fechaInicio debe ser anterior a fechaFin' };

    const usuario    = await Usuario.findById(idUsuario).select('metaConsumoMl nombre');
    if (!usuario) return { error: 'Usuario no encontrado' };
    const metaDiaria = usuario.metaConsumoMl || 0;

    const consumos     = await ConsumoAgua.find({ usuarioFinal: idUsuario, fechaHora: { $gte: inicio, $lte: fin } });
    const totalMl      = consumos.reduce((sum, c) => sum + c.consumoInstante, 0);
    const totalDias    = Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    const promedioDiario = totalDias > 0 ? Math.round(totalMl / totalDias) : 0;

    let diasCumplidos = 0;
    if (metaDiaria > 0) {
      const porDia = {};
      consumos.forEach(c => {
        const clave = c.fechaHora.toISOString().split('T')[0];
        porDia[clave] = (porDia[clave] || 0) + c.consumoInstante;
      });
      diasCumplidos = Object.values(porDia).filter(ml => ml >= metaDiaria).length;
    }

    return {
      periodo:        `${fechaInicio} al ${fechaFin}`,
      totalConsumido: `${totalMl.toLocaleString()} mL`,
      promedioDiario: `${promedioDiario.toLocaleString()} mL`,
      metaDiaria:     metaDiaria > 0 ? `${metaDiaria.toLocaleString()} mL` : 'No configurada',
      metaCumplida:   metaDiaria > 0 ? `${diasCumplidos} de ${totalDias} días` : 'Configura tu meta primero'
    };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 3 — Tareas pendientes hoy
const tareasPendientesHoy = async (idUsuario) => {
  try {
    const hoy = new Date();
    const pendientes = await AsignacionTarea.find({
      usuario: idUsuario,
      estadoTarea: { $in: ['pendiente', 'en_progreso'] },
      fechaAsignacion: { $gte: inicioDia(hoy), $lte: finDia(hoy) }
    }).populate('tarea', 'nombreTarea descripcion fechaFin');
    return {
      fecha: hoy.toISOString().split('T')[0],
      totalPendientes: pendientes.length,
      tareas: pendientes.map(a => ({
        nombreTarea: a.tarea?.nombreTarea || 'Sin nombre',
        descripcion: a.tarea?.descripcion || '',
        estado: a.estadoTarea,
        fechaAsignacion: a.fechaAsignacion
      }))
    };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 4 — Consumo del día en mL
const consumoDeHoy = async (idUsuario) => {
  try {
    const hoy    = new Date();
    const consumos = await ConsumoAgua.find({ usuarioFinal: idUsuario, fechaHora: { $gte: inicioDia(hoy), $lte: finDia(hoy) } });
    const totalMl  = consumos.reduce((sum, c) => sum + c.consumoInstante, 0);
    const usuario  = await Usuario.findById(idUsuario).select('metaConsumoMl');
    const metaMl   = usuario?.metaConsumoMl || 0;
    const porcentaje = metaMl > 0 ? Math.min(Math.round((totalMl / metaMl) * 100), 100) : null;
    return {
      fecha: hoy.toISOString().split('T')[0],
      consumoHoy: `${totalMl.toLocaleString()} mL`,
      metaDiaria: metaMl > 0 ? `${metaMl.toLocaleString()} mL` : 'No configurada',
      porcentajeCumplido: porcentaje !== null ? `${porcentaje}%` : 'Configura tu meta primero',
      registros: consumos.length
    };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 5 — Consumo semana en L + meta semanal
const consumoSemana = async (idUsuario) => {
  try {
    const hoy   = new Date();
    const lunes = lunesDeSemana(hoy);
    const consumos = await ConsumoAgua.find({ usuarioFinal: idUsuario, fechaHora: { $gte: lunes, $lte: finDia(hoy) } });
    const totalMl  = consumos.reduce((sum, c) => sum + c.consumoInstante, 0);
    const totalL   = (totalMl / 1000).toFixed(2);
    const diasTranscurridos = Math.round((finDia(hoy) - lunes) / (1000 * 60 * 60 * 24)) + 1;
    const usuario        = await Usuario.findById(idUsuario).select('metaConsumoMl');
    const metaDiaria     = usuario?.metaConsumoMl || 0;
    const metaSemanalMl  = metaDiaria * 7;
    const metaHastaHoyMl = metaDiaria * diasTranscurridos;
    return {
      semana: `${lunes.toISOString().split('T')[0]} al ${hoy.toISOString().split('T')[0]}`,
      diasTranscurridos,
      consumoSemana: `${totalL} L`,
      consumoSemanaML: `${totalMl.toLocaleString()} mL`,
      metaSemanal: metaSemanalMl > 0 ? `${(metaSemanalMl / 1000).toFixed(2)} L` : 'No configurada',
      consumoEsperadoHastaHoy: metaHastaHoyMl > 0 ? `${(metaHastaHoyMl / 1000).toFixed(2)} L` : 'No configurada',
      porcentajeSemana: metaHastaHoyMl > 0 ? `${Math.min(Math.round((totalMl / metaHastaHoyMl) * 100), 100)}%` : 'Configura tu meta primero'
    };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 6 — Tareas asignadas vs completadas HOY
const resumenTareasHoy = async (idUsuario) => {
  try {
    const hoy = new Date();
    const todasHoy   = await AsignacionTarea.find({ usuario: idUsuario, fechaAsignacion: { $gte: inicioDia(hoy), $lte: finDia(hoy) } }).populate('tarea', 'nombreTarea');
    const completadas = todasHoy.filter(a => a.estadoTarea === 'completada');
    const enProgreso  = todasHoy.filter(a => a.estadoTarea === 'en_progreso');
    const pendientes  = todasHoy.filter(a => a.estadoTarea === 'pendiente');
    return {
      fecha: hoy.toISOString().split('T')[0],
      tareasAsignadas: todasHoy.length,
      completadas: completadas.length,
      enProgreso: enProgreso.length,
      pendientes: pendientes.length,
      porcentajeCompletado: todasHoy.length > 0 ? `${Math.round((completadas.length / todasHoy.length) * 100)}%` : '0%',
      detalle: todasHoy.map(a => ({ tarea: a.tarea?.nombreTarea || 'Sin nombre', estado: a.estadoTarea }))
    };
  } catch (error) { return { error: error.message }; }
};

// SERVICIO 7 — Metas/tareas de la semana: asignadas vs completadas
const resumenMetasSemana = async (idUsuario) => {
  try {
    const hoy   = new Date();
    const lunes = lunesDeSemana(hoy);
    const asignacionesSemana = await AsignacionTarea.find({ usuario: idUsuario, fechaAsignacion: { $gte: lunes, $lte: finDia(hoy) } }).populate('tarea', 'nombreTarea');
    const totalAsignadas = asignacionesSemana.length;
    const completadas    = asignacionesSemana.filter(a => a.estadoTarea === 'completada').length;
    const pendientes     = asignacionesSemana.filter(a => a.estadoTarea === 'pendiente').length;
    const enProgreso     = asignacionesSemana.filter(a => a.estadoTarea === 'en_progreso').length;

    const porDia = {};
    asignacionesSemana.forEach(a => {
      const clave = new Date(a.fechaAsignacion).toISOString().split('T')[0];
      if (!porDia[clave]) porDia[clave] = { total: 0, completadas: 0 };
      porDia[clave].total++;
      if (a.estadoTarea === 'completada') porDia[clave].completadas++;
    });
    const diasConMetaCumplida = Object.values(porDia).filter(d => d.total > 0 && d.completadas === d.total).length;

    return {
      semana: `${lunes.toISOString().split('T')[0]} al ${hoy.toISOString().split('T')[0]}`,
      tareasAsignadasSemana: totalAsignadas,
      tareasCompletadas: completadas,
      tareasEnProgreso: enProgreso,
      tareasPendientes: pendientes,
      diasConTodasLasTareasCompletas: diasConMetaCumplida,
      porcentajeCompletado: totalAsignadas > 0 ? `${Math.round((completadas / totalAsignadas) * 100)}%` : '0%',
      avancePorDia: Object.entries(porDia).map(([fecha, d]) => ({ fecha, completadas: d.completadas, total: d.total, metaCumplida: d.completadas === d.total }))
    };
  } catch (error) { return { error: error.message }; }
};

module.exports = { guardarMetaConsumo, resumenPorPeriodo, tareasPendientesHoy, consumoDeHoy, consumoSemana, resumenTareasHoy, resumenMetasSemana };
