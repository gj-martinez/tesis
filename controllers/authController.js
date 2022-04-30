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
        let passHash = await bcryptjs.hash(pass,8)
        let fecha = new Date()

        conexion.query('INSERT INTO user SET ?',{name: name, username: user, password: passHash,connect: true,created: fecha, updated: fecha, role: role},(error, result) => {
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
            conexion.query('SELECT * FROM user WHERE username = ?', [user], async (error, results) =>{
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
            conexion.query('SELECT * FROM user WHERE id = ?', [decodificada.id], (err, result) => {
                if(!result){return next()}
                req.user = result[0]
                return next()
            })
        } catch (error) {
            console.log(error)
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
   /* 
   
    const user = req.body.fechaDesde
    const pass = req.body.fechaHasta    

    console.log(user + " - "+ pass)
    console.log(req.body)

    */
    console.log(req.body);
    console.log("llega aca ---");

    await conexion.query('SELECT type,value, created FROM metric', async (error, results) =>{
        if(!results){return res.json({status: 400, data : []})}     
        metrics = JSON.stringify(results);
        res.json({
            status : 200,
            data : results
        }) 
    })
    
}