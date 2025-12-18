// Probando

let edad = 16
let dinero = true;

if (edad >= 18 || dinero) {
    console.log("Apto para poder VICIAR")
} else {
    console.log("Supervisión de mamá y papá");
}

//AND (&&) = se tienen q cumplir ambas condiciones para q el resultado sea true.
//OR (||) = se tiene q cumplir al menos una de las condiciones.



//ciclos por repeticion
for (let i = 0; i < 5; i++) {
    console.log(" no se q hago")
}


//ciclos condicionales
// En este caso seria el while

//validacion de usuarios 
const usuarios = [
    { nombre: "Ana", edad: 20 , aceptoTerminos: true },
    { nombre: "Daniel", edad: 29 , aceptoTerminos:true }, 
    { nombre: "Talia", edad: 27 , aceptoTerminos:true  },
    { nombre: "Maria", edad: 25 , aceptoTerminos:false }
]

for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].edad >= 20 && usuarios[i].aceptoTerminos) {
        console.log(usuarios[i].nombre)
    }

}