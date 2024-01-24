const bodyParser = require('body-parser');
const mysql = require('mysql');
var express = require('express');
const moment = require('moment');
var router = express.Router();


//Inicio de la conexion con la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'control_asistencias'
});

//Verifiacion de la conexion con la base de datos
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

//Obteniendo la pagina principal
router.get('/', function(req, res, next) {
  connection.query('SELECT * FROM trabajadores', (err, results) => {
    if (err) throw err;
    res.render('index', { items: results });
  });
});

//Realizando las acciones para cargar las asistencias a la base de datos.
router.post('/', (req, res) => {
  let items;
  function cargarAsistencia(Fecha, idTrabajador, horaEntrada, horaSalida){

      connection.query('INSERT INTO asistencias (Fecha, IDTrabajador, horaEntrada, horaSalida) VALUES (?,?,?,?)', [Fecha,idTrabajador, horaEntrada, horaSalida], (err, results) => {
        if (err) throw err;
      });

  }
  connection.query('SELECT * FROM trabajadores', (err, results) => {
    if (err) throw err;
    items = results;

    for (let i = 0; i < items.length; i++){
      let check = req.body[`asistencia${i}`];

      if(typeof check !== "undefined"){
        console.log(check);
        let Fecha = req.body[`fecha`];
        let idTrabajador = req.body[`ID${i}`];
        let horaEntrada = req.body[`hora_entrada${i}`];
        let horaSalida = req.body[`hora_salida${i}`];
        cargarAsistencia(Fecha, idTrabajador, horaEntrada, horaSalida);
      } else {
        console.log("Error al cargar los datos a la base de datos");
        res.redirect('/');
        return;
      }

      if(i == items.length - 1){
        res.redirect('/');
      }
    }
  });
});

//Obteniendo la vista para agregar empleados
router.get('/agregar-trabajador', function(req, res, next) {
  res.render('add_trabajador');
});

// Realizando las acciones al enviar el formulario para cargar empleados
router.post('/agregar-trabajador', (req, res) => {
  const nombre = req.body.nombre;
  const apellido = req.body.apellido;
  const cedula = req.body.cedula;
  const cargo = req.body.cargo;
    connection.query('INSERT INTO trabajadores (nombre, apellido, cedula, cargo) VALUES (?,?,?,?)', [nombre,apellido,cedula,cargo], (err, results) => {
      if (err) throw err;
      res.redirect('/trabajadores');
    });
});

//Obteniendo la vista para mostrar los empleados
router.get('/trabajadores', function(req, res, next) {
  connection.query('SELECT * FROM trabajadores', (err, results) => {
    if (err) throw err;
    res.render('trabajadores', { items: results });
  });
});

//Obteniendo la vista para actualizar los datos de los empleados
router.get('/update-trabajador/:id', function(req, res, next) {
  const id = req.params.id;
  const sql = `SELECT * FROM trabajadores WHERE ID = '${id}'`;
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.render('update_trabajador', { items: results });
  });
});

//Realizando las acciones para actualizar el empleado cuando se envíe el formulario desde la vista de actualización
router.post('/update-trabajador/:id', function(req, res, next) {
  const id = req.params.id;
  const nombre = req.body.nombre;
  const apellido = req.body.apellido;
  const cedula = req.body.cedula;
  const cargo = req.body.cargo;

  const sql = `UPDATE trabajadores SET nombre = '${nombre}', apellido = '${apellido}', cedula = '${cedula}', cargo = '${cargo}' WHERE id = ${id}`;

  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result.affectedRows + " registro(s) actualizado(s)");
    res.redirect('/trabajadores');
  });
});

//Obteniendo la vista para eliminar trabajadores
router.get('/delete-trabajador/:id', function(req, res, next) {
  const id = req.params.id;
  connection.query('DELETE FROM trabajadores WHERE ID = ?', id, function (error) {
    if (error) {
      console.error('Error al eliminar el producto:', error.message);
    } else if (this.changes > 0) {
      console.log(`Trabajador con ID ${id} eliminado.`);
      res.redirect('/trabajadores')
    } else {
      res.redirect('/trabajadores')
    }
  });
});

//Obteniendo la vista para realizar consultas de las asistencias de cualquier día
router.get('/consulta', function(req, res, next) {
  let items;
  const date = new Date();
  const dateObj = moment(date).format('YYYY-MM-DD');


  const sql = `SELECT * FROM trabajadores JOIN asistencias ON trabajadores.ID = asistencias.IDTrabajador WHERE asistencias.Fecha = '${dateObj}'`;
  connection.query(sql, (err, results) => {
    if (err) throw err;
    itemsb = results;
    const items = itemsb.map(item => {
      const horaEntrada12h = moment(item.horaEntrada, 'HH:mm:ss').format('hh:mm:ss A');
      const horaSalida12h = moment(item.horaSalida, 'HH:mm:ss').format('hh:mm:ss A');
      return {
        ...item,
        horaEntrada: horaEntrada12h,
        horaSalida: horaSalida12h
      };
    });
    res.render('consulta', { items });
  });

});

module.exports = router;
