require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const app      = express()
const port     = 443
const net      = require('node:net');
const mongoose = require('mongoose');
const auth     = require('./middleware/auth');

// ─── Controllers ─────────────────────────────────────────────────────────────
const usuarioController    = require('./controllers/usuarioController.js');
const tareaController      = require('./controllers/tareaController.js');
const consumoController    = require('./controllers/consumoController.js');
const asignacionController = require('./controllers/asignacionController.js');
const avanceMetaController = require('./controllers/avanceMetaController.js');
const avanceTareaController= require('./controllers/avanceTareaController.js');
const usuarioAdminCtrl     = require('./controllers/usuarioAdminController.js');
const tareaAdminController = require('./controllers/tareaAdminController.js');
const metaController       = require('./controllers/metaController.js');
const serviciosCtrl        = require('./serviciosController.js');   // ← NUEVO
const ProductoDrinkpal     = require('./models/ProductoDrinkpal');
const Usuario = require('./models/Usuario');
const Rol = require('./models/Rol');

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const DIST_DIR = path.join(__dirname, 'dist');

const SSL_OPTIONS = {
  key: fs.readFileSync('/opt/certs/privkey.pem'),
  cert: fs.readFileSync('/opt/certs/fullchain.pem')
};

console.log("start");
app.use(cors(
  {
    methods: ["POST", "GET"]
  }
));
app.use(express.json());


//-------------------------------------------------------------
app.use(express.static(DIST_DIR));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Error: falta index.html en dist');
    }
  });
});

https.createServer(SSL_OPTIONS, app).listen(443, () => {
  console.log('HTTPS corriendo en 443');
});

http.createServer((req, res) => {
  res.writeHead(301, {
    Location: 'https://' + req.headers.host + req.url
  });
  res.end();
}).listen(80);
//-------------------------------------------------------------

// ════════════════════════════════════════════════════════════
//  RUTAS PÚBLICAS
// ════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {

  const respuesta = await usuarioController.login(req.body);

  if (respuesta.error) {
    return res.status(400).json({
      msg: respuesta.error
    });
  }

  res.json({
    token: respuesta.token,
    _id: respuesta._id,
    correo: respuesta.correo
  });

});

app.post('/api/admin/login', async (req, res) => {
  const respuesta = await usuarioAdminCtrl.loginAdmin(req.body);
  res.send({ token: respuesta });
});


// ════════════════════════════════════════════════════════════
//  USUARIOS FINALES
// ════════════════════════════════════════════════════════════

app.post('/api/usuarios', async (req, res) => {
  const result = await crearUsuario(req.body);

  if (result.error) {
    // Devuelve 400 con el mensaje de error para que el front lo muestre
    return res.status(400).json({ msg: result.error });
  }

  // Registro exitoso: genera token para que el usuario quede logueado de inmediato
  const jwt = require('jsonwebtoken');
  const payload = { usuario: { id: result.usuario.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });

  res.json({ token, msg: 'Usuario creado exitosamente' });
});



app.get('/api/usuarios', auth, async (req, res) => {
  res.send({ msg: await usuarioController.obtenerUsuarios() });
});
app.post('/api/usuarios/correo', auth, async (req, res) => {
  res.send({ msg: await usuarioController.getcorreoUsuarios(req.body) });
});


// ════════════════════════════════════════════════════════════
//  METAS / RACHAS
// ════════════════════════════════════════════════════════════
app.post('/api/metas', auth, async (req, res) => {
  res.send({ msg: await metaController.crearMeta(req.body) });
});
app.get('/api/metas', auth, async (req, res) => {
  res.send({ msg: await metaController.obtenerMetas() });
});
app.get('/api/metas/:id', auth, async (req, res) => {
  res.send({ msg: await metaController.obtenerMetaPorId(req.params.id) });
});
app.get('/api/metas/:idMeta/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaController.obtenerTareasPorMeta(req.params.idMeta) });
});
app.get('/api/metas/:idMeta/avances', auth, async (req, res) => {
  res.send({ msg: await avanceMetaController.obtenerAvancesPorMeta(req.params.idMeta) });
});
app.put('/api/metas/:id', auth, async (req, res) => {
  res.send({ msg: await metaController.actualizarMeta(req.params.id, req.body) });
});
app.delete('/api/metas/:id', auth, async (req, res) => {
  res.send({ msg: await metaController.eliminarMeta(req.params.id) });
});


// ════════════════════════════════════════════════════════════
//  TAREAS
// ════════════════════════════════════════════════════════════
app.post('/api/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaController.crearTarea(req.body) });
});
app.get('/api/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaController.obtenerTareas() });
});
app.get('/api/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaController.obtenerTareaPorId(req.params.id) });
});
app.get('/api/tareas/:idTarea/avances', auth, async (req, res) => {
  res.send({ msg: await avanceTareaController.obtenerAvancesPorTarea(req.params.idTarea) });
});
app.put('/api/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaController.actualizarTarea(req.params.id, req.body) });
});
app.delete('/api/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaController.eliminarTarea(req.params.id) });
});


// ════════════════════════════════════════════════════════════
//  CONSUMO DE AGUA
// ════════════════════════════════════════════════════════════
app.post('/api/consumos', auth, async (req, res) => {
  res.send({ msg: await consumoController.registrarConsumo(req.body) });
});
app.get('/api/consumos', auth, async (req, res) => {
  res.send({ msg: await consumoController.obtenerConsumos() });
});
app.get('/api/consumos/:id', auth, async (req, res) => {
  res.send({ msg: await consumoController.obtenerConsumoPorId(req.params.id) });
});
app.get('/api/usuarios/:idUsuario/consumos', auth, async (req, res) => {
  res.send({ msg: await consumoController.obtenerConsumosPorUsuario(req.params.idUsuario) });
});
app.delete('/api/consumos/:id', auth, async (req, res) => {
  res.send({ msg: await consumoController.eliminarConsumo(req.params.id) });
});

// GET /usuarios/:idUsuario/racha — racha actual del usuario
app.get('/api/usuarios/:idUsuario/racha', auth, async (req, res) => {
  const resultado = await consumoController.calcularRacha(req.params.idUsuario);
  res.json(resultado);
});


// ════════════════════════════════════════════════════════════
//  ASIGNACIONES
// ════════════════════════════════════════════════════════════
app.post('/api/asignaciones', auth, async (req, res) => {
  res.send({ msg: await asignacionController.crearAsignacion(req.body) });
});
app.get('/api/asignaciones', auth, async (req, res) => {
  res.send({ msg: await asignacionController.obtenerAsignaciones() });
});
app.get('/api/asignaciones/:id', auth, async (req, res) => {
  res.send({ msg: await asignacionController.obtenerAsignacionPorId(req.params.id) });
});
app.get('/api/usuarios/:idUsuario/asignaciones', auth, async (req, res) => {
  res.send({ msg: await asignacionController.obtenerAsignacionesPorUsuario(req.params.idUsuario) });
});
app.put('/api/asignaciones/:id', auth, async (req, res) => {
  res.send({ msg: await asignacionController.actualizarAsignacion(req.params.id, req.body) });
});
app.delete('/api/asignaciones/:id', auth, async (req, res) => {
  res.send({ msg: await asignacionController.eliminarAsignacion(req.params.id) });
});


// ════════════════════════════════════════════════════════════
//  AVANCE DE METAS  (historial — sin DELETE ni PUT)
// ════════════════════════════════════════════════════════════
app.post('/api/avancemetas', auth, async (req, res) => {
  res.send({ msg: await avanceMetaController.registrarAvanceMeta(req.body) });
});
app.get('/api/avancemetas', auth, async (req, res) => {
  res.send({ msg: await avanceMetaController.obtenerAvancesMeta() });
});
app.get('/api/usuarios/:idUsuario/avancemetas', auth, async (req, res) => {
  res.send({ msg: await avanceMetaController.obtenerAvancesPorUsuario(req.params.idUsuario) });
});


// ════════════════════════════════════════════════════════════
//  AVANCE DE TAREAS  (historial — sin DELETE ni PUT)
// ════════════════════════════════════════════════════════════
app.post('/api/avancetareas', auth, async (req, res) => {
  res.send({ msg: await avanceTareaController.registrarAvanceTarea(req.body) });
});
app.get('/api/avancetareas', auth, async (req, res) => {
  res.send({ msg: await avanceTareaController.obtenerAvancesTarea() });
});
app.get('/api/usuarios/:idUsuario/avancetareas', auth, async (req, res) => {
  res.send({ msg: await avanceTareaController.obtenerAvancesPorUsuario(req.params.idUsuario) });
});


// ════════════════════════════════════════════════════════════
//  USUARIOS ADMINISTRATIVOS
// ════════════════════════════════════════════════════════════
app.post('/api/admin/usuarios', auth, async (req, res) => {
  res.send({ msg: await usuarioAdminCtrl.crearUsuarioAdmin(req.body) });
});
app.get('/api/admin/usuarios', auth, async (req, res) => {
  res.send({ msg: await usuarioAdminCtrl.obtenerUsuariosAdmin() });
});
app.get('/api/admin/usuarios/:id', auth, async (req, res) => {
  res.send({ msg: await usuarioAdminCtrl.obtenerUsuarioAdminPorId(req.params.id) });
});
app.put('/api/admin/usuarios/:id', auth, async (req, res) => {
  res.send({ msg: await usuarioAdminCtrl.actualizarUsuarioAdmin(req.params.id, req.body) });
});
app.delete('/api/admin/usuarios/:id', auth, async (req, res) => {
  res.send({ msg: await usuarioAdminCtrl.eliminarUsuarioAdmin(req.params.id) });
});


// ════════════════════════════════════════════════════════════
//  TAREAS ADMINISTRATIVAS
// ════════════════════════════════════════════════════════════
app.post('/api/admin/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.crearTareaAdmin(req.body) });
});
app.get('/api/admin/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.obtenerTareasAdmin() });
});
app.get('/api/admin/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.obtenerTareaAdminPorId(req.params.id) });
});
app.get('/api/admin/usuarios/:idUsuarioAdmin/tareas', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.obtenerTareasAdminPorUsuario(req.params.idUsuarioAdmin) });
});
app.put('/api/admin/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.actualizarTareaAdmin(req.params.id, req.body) });
});
app.delete('/api/admin/tareas/:id', auth, async (req, res) => {
  res.send({ msg: await tareaAdminController.eliminarTareaAdmin(req.params.id) });
});


// ════════════════════════════════════════════════════════════
//  ★ SERVICIOS NUEVOS — Rutas bajo /mi/ (usuario autenticado)
// ════════════════════════════════════════════════════════════

// S1 — Guardar meta de consumo diario
app.post('/api/mi/meta-consumo', auth, async (req, res) => {
  res.send(await serviciosCtrl.guardarMetaConsumo(req.usuario.id, req.body));
});

// S2 — Resumen de consumo entre dos fechas
app.post('/api/mi/resumen-periodo', auth, async (req, res) => {
  res.send(await serviciosCtrl.resumenPorPeriodo(req.usuario.id, req.body));
});

// S3 — Tareas pendientes hoy
app.get('/api/mi/tareas-pendientes', auth, async (req, res) => {
  res.send(await serviciosCtrl.tareasPendientesHoy(req.usuario.id));
});

// S4 — Consumo del día en mL
app.get('/api/mi/consumo-hoy', auth, async (req, res) => {
  res.send(await serviciosCtrl.consumoDeHoy(req.usuario.id));
});

// S5 — Consumo semana en L + meta semanal
app.get('/api/mi/consumo-semana', auth, async (req, res) => {
  res.send(await serviciosCtrl.consumoSemana(req.usuario.id));
});

// S6 — Tareas asignadas vs completadas hoy
app.get('/api/mi/resumen-tareas-hoy', auth, async (req, res) => {
  res.send(await serviciosCtrl.resumenTareasHoy(req.usuario.id));
});

// S7 — Metas/tareas semana: asignadas vs completadas
app.get('/api/mi/resumen-semana', auth, async (req, res) => {
  res.send(await serviciosCtrl.resumenMetasSemana(req.usuario.id));
});


// ════════════════════════════════════════════════════════════
//  RUTA ORIGINAL — HORA + SOCKET
// ════════════════════════════════════════════════════════════
app.get('/api/', auth, (req, res) => { res.send(obtenerHoraActual()); });
app.post('/api/leds', auth, (req, res) => {
  const { led1, led2 } = req.body;
  socketExterno.write("$LED 1 " + led1 + "\n");
  socketExterno.write("$LED 2 " + led2 + "\n");
  res.send({ msg: "Se escribieron los LEDs" });
});
app.get('/api/bateria', (req, res) => {
  let max = 100
  let min = 0
  let bateria = Math.floor(Math.random() *  (max - min + 1)) + min
  let payload = {
    voltaje: bateria
  }
  res.send(payload)
});

app.post('/api/productos', auth, async (req, res) => {
  try {
    const { id_producto } = req.body;
    if (!id_producto) return res.status(400).json({ msg: 'id_producto es requerido' });

    const existe = await ProductoDrinkpal.findOne({ id_producto });
    if (existe) return res.status(400).json({ msg: 'Ese ID ya existe' });

    const nuevo = await ProductoDrinkpal.create({ id_producto });
    res.json({ msg: 'Producto creado', producto: nuevo });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /me — usuario actual desde token
app.get('/api/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-clave').populate('rol');
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});
 
// PUT /usuarios/:id/meta — actualizar meta diaria de agua
app.put('/api/usuarios/:id/meta', auth, async (req, res) => {
  try {
    const updated = await Usuario.findByIdAndUpdate(
      req.params.id,
      { metaConsumoMl: req.body.metaConsumoMl },
      { new: true }
    ).select('-clave');
    res.json({ msg: updated });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});
 
// POST /usuarios/:idUsuario/consumos/seed — insertar datos históricos simulados
app.post('/api/usuarios/:idUsuario/consumos/seed', auth, async (req, res) => {
  try {
    const ConsumoAgua = require('./models/ConsumoAgua');
    const docs = (req.body.consumos || []).map(c => ({
      usuarioFinal: req.params.idUsuario,
      fechaHora: new Date(c.fechaHora),
      consumoInstante: c.consumoInstante
    }));
    if (docs.length === 0) return res.json({ count: 0 });
    const saved = await ConsumoAgua.insertMany(docs);
    res.json({ count: saved.length });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});
 
// GET /usuarios/:idUsuario/consumos/semana — últimos 7 días de consumo
app.get('/api/usuarios/:idUsuario/consumos/semana', auth, async (req, res) => {
  try {
    const ConsumoAgua = require('./models/ConsumoAgua');
    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 6);
    hace7dias.setHours(0, 0, 0, 0);
    const consumos = await ConsumoAgua.find({
      usuarioFinal: req.params.idUsuario,
      fechaHora: { $gte: hace7dias }
    }).sort({ fechaHora: 1 });
    res.json({ msg: consumos });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});
 
// GET /usuarios/:idUsuario/consumos/hoy — total del día actual
app.get('/api/usuarios/:idUsuario/consumos/hoy', auth, async (req, res) => {
  try {
    const ConsumoAgua = require('./models/ConsumoAgua');
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const consumos = await ConsumoAgua.find({
      usuarioFinal: req.params.idUsuario,
      fechaHora: { $gte: inicioHoy }
    });
    const total = consumos.reduce((s, c) => s + c.consumoInstante, 0);
    res.json({ total, registros: consumos.length });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});



// ════════════════════════════════════════════════════════════
//  RUTAS ADMINISTRATIVAS NUEVAS
// ════════════════════════════════════════════════════════════

// DELETE /admin/usuarios/por-correo
// Elimina un usuario final por correo y libera su producto (usado → false)
app.delete('/api/admin/usuarios/por-correo', auth, async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ msg: 'El correo es requerido' });

    const usuario = await Usuario.findOne({ correo: correo.toLowerCase().trim() });
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado con ese correo' });

    // Liberar el producto asociado: vuelve a estar disponible
    if (usuario.id_producto) {
      await ProductoDrinkpal.findOneAndUpdate(
        { id_producto: usuario.id_producto },
        { usado: false, fechaRegistro: null }
      );
    }

    // Eliminar el usuario
    await Usuario.findByIdAndDelete(usuario._id);

    res.json({ msg: `Usuario eliminado y producto liberado correctamente` });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});


// GET /admin/consumos
// Devuelve registros de consumo con filtros opcionales por fecha, correo e id_producto.
// Query params: fechaInicio, fechaFin, correo, id_producto  (todos opcionales)
app.get('/api/admin/consumos', auth, async (req, res) => {
  try {
    const ConsumoAgua = require('./models/ConsumoAgua');
    const { fechaInicio, fechaFin, correo, id_producto } = req.query;

    const filtro = {};

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filtro.fechaHora = {};
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        filtro.fechaHora.$gte = inicio;
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        filtro.fechaHora.$lte = fin;
      }
    }

    // Filtro por usuario (correo) o por id_producto
    if (correo || id_producto) {
      const usuarioFiltro = {};
      if (correo)      usuarioFiltro.correo      = correo.toLowerCase().trim();
      if (id_producto) usuarioFiltro.id_producto  = id_producto.trim();

      const usuarios = await Usuario.find(usuarioFiltro).select('_id');
      const ids = usuarios.map(u => u._id);

      // Si se especificó un filtro de usuario pero no existe nadie, devuelve vacío
      if (ids.length === 0) return res.json({ msg: [] });

      filtro.usuarioFinal = { $in: ids };
    }

    const consumos = await ConsumoAgua.find(filtro)
      .populate('usuarioFinal', 'nombre correo id_producto metaConsumoMl fechaRegistro')
      .sort({ fechaHora: -1 });

    res.json({ msg: consumos });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});



app.get('/api/admin/usuarios-resumen', auth, async (req, res) => {
  try {
    const ConsumoAgua = require('./models/ConsumoAgua');
 
    const usuarios = await Usuario.find()
      .select('nombre correo id_producto metaConsumoMl racha fechaRegistro')
      .lean();
 
    const resultado = await Promise.all(usuarios.map(async (u) => {
      const consumos    = await ConsumoAgua.find({ usuarioFinal: u._id }).lean();
      const consumoTotal = consumos.reduce((s, c) => s + (c.consumoInstante || 0), 0);
 
      // Racha: usar el campo del usuario (se actualiza al registrar consumo)
      // Si el campo no existe aún, calcular desde el último registro
      let racha = u.racha || 0;
      if (!racha && consumos.length > 0) {
        const sorted = consumos.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
        racha = sorted[0].racha || 0;
      }
 
      return {
        nombre:       u.nombre,
        correo:       u.correo,
        idProducto:   u.id_producto,
        consumoTotal,
        racha,
        fechaRegistro: u.fechaRegistro
      };
    }));
 
    res.json({ msg: resultado });
  } catch (e) {
    console.error('Error en /admin/usuarios-resumen:', e);
    res.status(500).json({ msg: e.message });
  }
});
 
 
// ──────────────────────────────────────────────────────────────
// GET /admin/productos/disponibles
// Devuelve los productos DrinkPal que aún no han sido usados
// ──────────────────────────────────────────────────────────────
app.get('/api/admin/productos/disponibles', auth, async (req, res) => {
  try {
    const productos = await ProductoDrinkpal.find({ usado: false }).lean();
    res.json({ msg: productos });
  } catch (e) {
    console.error('Error en /admin/productos/disponibles:', e);
    res.status(500).json({ msg: e.message });
  }
});
 
 
// ──────────────────────────────────────────────────────────────
// GET /admin/productos/en-uso
// Devuelve los productos en uso junto con el correo y nombre del usuario
// ──────────────────────────────────────────────────────────────
app.get('/api/admin/productos/en-uso', auth, async (req, res) => {
  try {
    const productos = await ProductoDrinkpal.find({ usado: true }).lean();
 
    const resultado = await Promise.all(productos.map(async (p) => {
      const usuario = await Usuario.findOne({ id_producto: p.id_producto })
        .select('correo nombre')
        .lean();
      return {
        id_producto: p.id_producto,
        correo:      usuario ? usuario.correo : 'N/A',
        nombre:      usuario ? usuario.nombre : 'N/A',
        fechaRegistro: p.fechaRegistro
      };
    }));
 
    res.json({ msg: resultado });
  } catch (e) {
    console.error('Error en /admin/productos/en-uso:', e);
    res.status(500).json({ msg: e.message });
  }
});
 
 
// ──────────────────────────────────────────────────────────────
// POST /admin/crear-admin
// Crea un usuario con rol admin. Usa id_producto = 'DP-admin'
// (puede repetirse entre administradores, sin pasar por ProductoDrinkpal)
// ──────────────────────────────────────────────────────────────
app.post('/api/admin/crear-admin', auth, async (req, res) => {
  try {
    const { correo, nombre, clave } = req.body;
 
    if (!correo) return res.status(400).json({ msg: 'El correo es obligatorio' });
    if (!nombre) return res.status(400).json({ msg: 'El nombre es obligatorio' });
    if (!clave)  return res.status(400).json({ msg: 'La clave es obligatoria' });
 
    // Verificar correo duplicado
    const existe = await Usuario.findOne({ correo: correo.toLowerCase().trim() });
    if (existe) return res.status(400).json({ msg: 'Ya existe una cuenta con ese correo' });
 
    // Obtener el rol admin
    const rolAdmin = await Rol.findOne({ cargo: 'admin' });
    if (!rolAdmin) return res.status(400).json({ msg: 'Rol admin no encontrado en la base de datos' });
 
    // Hash de la clave
    const bcrypt = require('bcryptjs');
    const salt   = await bcrypt.genSalt(10);
    const claveHash = await bcrypt.hash(clave, salt);
 
    const nuevoAdmin = new Usuario({
      correo:      correo.toLowerCase().trim(),
      nombre:      nombre.trim(),
      clave:       claveHash,
      id_producto: 'DP-admin',   // fijo para todos los admin, puede repetirse
      rol:         rolAdmin._id
    });
 
    await nuevoAdmin.save();
    res.json({ msg: 'Administrador creado correctamente' });
 
  } catch (e) {
    console.error('Error en /admin/crear-admin:', e);
    res.status(500).json({ msg: e.message });
  }
});


app.listen(port, () => { console.log(`Servidor escuchando en el puerto ${port}`); });


// ════════════════════════════════════════════════════════════
//  SERVIDOR TCP
// ════════════════════════════════════════════════════════════
var socketExterno;
const server = net.createServer((socket) => {
  socketExterno = socket;
  console.log('Cliente Socket conectado');
  socket.on('data', (data) => { console.log('Datos recibidos: ' + data.toString()); });
  socket.on('end', () => { console.log('Cliente Socket desconectado'); });
});

function obtenerHoraActual() {
  const ahora = new Date();
  if (socketExterno) socketExterno.write("OK\n\r");
  return { hora: ahora.toLocaleTimeString() };
}


// ════════════════════════════════════════════════════════════
//  MONGODB
// ════════════════════════════════════════════════════════════
conectar_a_mongo().catch(err => console.log(err));
async function conectar_a_mongo() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Conectado a MongoDB");
}

