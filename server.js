const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mysql = require("mysql")
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const mqtt = require('mqtt')
const router = express.Router();


const authController = require('./controllers/authController')
//const conexion = require('../database/db')



const pool = mysql.createPool({
    host: 'localhost',
    database:'tesis',
    user: 'root',
    password: '1234'
})


function insert(pool, data,callback){
    try {
        let insertQuery = "INSERT INTO `Metricas` (`UsuarioId`, `tipo`, `valor`, `fecha`,`hora`,`createdAt`) VALUES (?,?,?,?,?,?)"
        let query = mysql.format(insertQuery,[data.user_id,data.topic,data.value,data.fecha,data.hora,data.created])
        pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(query, function(err, result) {
                if (err) throw err;
                callback(result)
                
                connection.release();
            });
        });
    } catch (error) {
        console.log(error)
    }
}

const client  = mqtt.connect('mqtt://192.168.0.95')

io.on('connection', (socket) => {
  console.log('a user connected');
});

//seteamos el motor de plantillas
app.set('view engine', 'ejs');

//seteamos la carpeta publica para archivos estaticos
//app.use(express.static('public'))

app.use(express.static(__dirname + '/public'));


//para procesar datos enviados desde forms
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

//seteamos las variables de entorno
dotenv.config({path: './env/.env'})

//seatemos las cookies
app.use(cookieParser())

//llamar al router

//app.use('/',require('./routes/router'))
let usuarioConetado = [];

//router para las vistas
app.get('/', authController.isAuthenticated,(req, res)=>{    

    usuarioConetado = req.user
    console.log(usuarioConetado)
    res.render("index",{user: req.user})
})
app.get('/login', (req, res)=>{
    res.render("login",{alert:false})
})
app.get('/register', (req, res)=>{
    res.render("register")
})

app.get('/export', (req, res)=>{
    res.render("export")
})
//router para los metos del controlador
app.post('/register',authController.register)
app.post('/login',authController.login)
app.get('/logout',authController.logout, (req, res)=> {
    usuarioConetado = []
})
app.post('/getMetric',authController.getMetric)
app.post('/getMetricMax',authController.getMetricMax)
app.post('/getMetricMin',authController.getMetricMin)
app.post('/getMetricAvg',authController.getMetricAvg)
app.get('/getUser',authController.getUser)


app.use(function(req, res, next) {
    if(!req.user)
        res.header('Cache-Control','private no-cache, no-store, must-revalidate');
    next();
})


client.on('connect', function () {
    client.subscribe('temperatura', function (err) {
        if (err) {
            console.log("Hubo un error")
        }
    })
})

client.on('message', function (topic, message) {
    try {
        // message is Buffer
        
        date = new Date();
		año = date.getFullYear();
		mes = date.getMonth() + 1;
		dia = date.getDate();
		hora = ('0'+date.getHours()).slice(-2);
		minuto = ('0'+date.getMinutes()).slice(-2);
		segundo = ('0'+date.getSeconds()).slice(-2);
		fecha = año+"-"+mes+"-"+dia;
        time = hora+":"+minuto+":"+segundo;

        io.emit('data',{
            value: message.toString()
        });

        if(usuarioConetado.id > 0 && usuarioConetado.rol === "user"){
            console.log(usuarioConetado)
            insert(
                pool,
                {
                    user_id: usuarioConetado.id,
                    topic:topic,
                    value:message.toString(),
                    fecha:fecha,
                    hora:time,
                    created:date
                },
            );
        }
        
        //client.end()
    } catch (error) {
        console.error(error)
    }
})


server.listen(3000,()=>{
    console.log('listening on port 3000');
});
