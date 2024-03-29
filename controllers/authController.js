const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const conexion = require('../database/db')
const {promisify} = require('util')

exports.register = async (req, res, next) =>{
    try {
        let role = ""
        if(req.body.roles){
            role = "admin"
        }else{
            role = "user"
        }
        const name = req.body.name
        const user = req.body.user
        const pass = req.body.pass    

        console.log(req.body)

        if(name === ""){
            return res.render('register',{
                alert:true,
                alertTitle: "Advertencia",
                alertMessage: "Debe ingresar un nombre",
                alertIcon: "info",
                showConfirmButton:true,
                timer:15000,
                ruta: 'register'
            })
        }
        if(user === ""){
            return res.render('register',{
                alert:true,
                alertTitle: "Advertencia",
                alertMessage: "Debe ingresar un nombre de usuario",
                alertIcon: "info",
                showConfirmButton:true,
                timer:15000,
                ruta: 'register'
            })
        }
        if(pass === ""){
            return res.render('register',{
                alert:true,
                alertTitle: "Advertencia",
                alertMessage: "Debe ingresar una contraseña",
                alertIcon: "info",
                showConfirmButton:true,
                timer:15000,
                ruta: 'register'
            })
        }

        let passHash = await bcryptjs.hash(pass,8)
        let fecha = new Date()

        conexion.query('INSERT INTO Usuarios SET ?',{nombre: name, nombreUsuario: user, password: passHash,createdAt: fecha,rol: role},(error, result) => {
            if (error) {console.log(error)}
            res.redirect('/')
        })
    } catch (error) {
        console.log(error)
    }
}

exports.login = async (req, res) => {
    try {
        const user = req.body.user
        const pass = req.body.pass    

        if(!user || !pass) {
            res.render('login',{
                alert:true,
                alertTitle: "Advertencia",
                alertMessage: "Ingrese un usuario y password",
                alertIcon: "info",
                showConfirmButton:true,
                timer:15000,
                ruta: 'login'
            })
        }else{
            conexion.query('SELECT * FROM Usuarios WHERE nombreUsuario = ?', [user], async (error, results) =>{
                if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].password))){
                    res.render('login',{
                        alert:true,
                        alertTitle: "Error",
                        alertMessage: "Usuario y/o password incorrectas",
                        alertIcon: "error",
                        showConfirmButton:true,
                        timer:15000,
                        ruta: 'login'
                    })
                }else{
                    const id = results[0].id
                    const token = jwt.sign({id:id}, process.env.JWT_SECRETO,{
                        expiresIn: process.env.JWT_TIEMPO_EXPIRA
                    })

                    const cookieOptions = {
                        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    }

                    res.cookie('jwt', token, cookieOptions)
                    res.render('login',{
                        alert:true,
                        alertTitle: "Conexion exitosa",
                        alertMessage: "Login correcto",
                        alertIcon: "success",
                        showConfirmButton:false,
                        timer:800,
                        ruta: ''
                    })
                }
            })
        }
    } catch (error) {
        console.log(error)
    }
}

exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt){
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO)
            conexion.query('SELECT * FROM Usuarios WHERE id = ?', [decodificada.id], (err, result) => {
                if(!result){return next()}
                req.user = result[0]
                return next()
            })
        } catch (error) {
            res.redirect('/login')
            return next()
        }
    }else{
        res.redirect('/login')
    }
}

exports.logout = function(req, res){
    res.clearCookie('jwt')
    return res.redirect('/')
}

exports.getMetric = async function(req, res){
    userId = req.body.user;
    fechaDesde = req.body.fechaDesde;
    fechaHasta = req.body.fechaHasta;
    conexion.query('SELECT tipo,valor, fecha,hora,createdAt FROM Metricas WHERE fecha BETWEEN ? AND ? AND usuarioId = ? ', [fechaDesde,fechaHasta,userId], (error, results) =>{
        if(!results){return res.json({status: 400, data : []})}     
        metrics = JSON.stringify(results);
        res.json({
            status : 200,
            data : results
        }) 
    })
    
}

exports.getMetricMax = async function(req, res){
     conexion.query('SELECT Max(valor) as maximo FROM Metricas WHERE usuarioId = ?', [req.body.user], (error, results) =>{
         if(!results){return res.json({status: 400, data : []})}     
         res.json({
             status : 200,
             data : results
         }) 
     })
     
}

exports.getMetricMin = async function(req, res){
     conexion.query('SELECT Min(valor) as minimo FROM Metricas WHERE usuarioId = ?', [req.body.user], (error, results) =>{
         if(!results){return res.json({status: 400, data : []})}     
         res.json({
             status : 200,
             data : results
         }) 
     })
     
}

exports.getMetricAvg = async function(req, res){
     conexion.query('SELECT FORMAT(AVG(valor), 2) as promedio FROM Metricas WHERE usuarioId = ?', [req.body.user], (error, results) =>{
         if(!results){return res.json({status: 400, data : []})}     
         res.json({
             status : 200,
             data : results
         }) 
     })
     
}

exports.getUser = async function(req, res){
    conexion.query('SELECT id, nombreUsuario from Usuarios where rol = "user"', (error, results) =>{
        if(!results){return res.json({status: 400, data : []})}     
        res.json({
            status : 200,
            data : results
        }) 
    })
}

exports.getGroupMetric = async function(req, res){
    fecha = req.body.fecha;
    conexion.query('select m.UsuarioId, count(*) as total , u.nombreUsuario from Metricas as m inner join Usuarios as u on m.UsuarioId = u.id where  fecha = ? group by UsuarioId', [fecha],(error, results) =>{
        if(!results){return res.json({status: 400, data : []})}     
        res.json({
            status : 200,
            data : results
        }) 
    })
}
