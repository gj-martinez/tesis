
CREATE TABLE IF NOT EXISTS Usuarios (
	id integer AUTO_INCREMENT ,
    nombre varchar(255) NOT NULL,
    nombreUsuario varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    rol varchar(255) NOT NULL,
    createdAt DATETIME NOT NULL, 

    PRIMARY KEY (id)
);


CREATE TABLE IF NOT EXISTS Metricas (
    id integer AUTO_INCREMENT,
    tipo varchar(255) NOT NULL,
    valor Decimal(5,2) NOT NULL,
    fecha Date NOT NULL,
    hora Time NOT NULL,
    createdAt DATETIME NOT NULL, 
    UsuarioId INTEGER NOT NULL, 

    PRIMARY KEY (id),
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios (id) 
);