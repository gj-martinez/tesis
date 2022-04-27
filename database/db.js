const mysql = require('mysql');

const conexion = mysql.createConnection({
    host: 'localhost',
    database:'tesis',
    user: 'root',
    password: '1234'
})

conexion.connect((error) =>{
    if(error) {
        console.log("El error de la conexion es: " + error)
        return
    }
    console.log("Conectado a la base de datos")
})





module.exports = conexion