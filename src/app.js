/*fetch('https://freetestapi.com/api/v1/actors')
    .then(response => {
        if (!response.ok) {
            throw new Error('error ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
    
        data.forEach(actor => {
            const id = actor.id;
            const name = actor.name;
            const awards = actor.awards;

            /
            console.log(`ID: ${id}, Name: ${name}, Awards: ${awards.join(', ')}`);
        });
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });*/

document.addEventListener("DOMContentLoaded", () => {
  // Espera a que el DOM esté completamente cargado antes de ejecutar el código
  const urlApi = "https://freetestapi.com/api/v1/actors"; // URL de la API para obtener los actores
  window.tablaActores = new TablaActores(urlApi); // Crea una instancia de TablaActores y la asigna a una variable global

  // Agregar campo de búsqueda
  const searchInput = document.getElementById("search-actor"); // Obtiene el elemento de entrada de búsqueda por su ID
  searchInput.addEventListener("input", (event) => {
    // Añade un evento de escucha para detectar cambios en el campo de búsqueda
    const query = event.target.value; // Obtiene el valor actual del campo de búsqueda
    tablaActores.buscarActorPorNombre(query); // Llama al método buscarActorPorNombre con el valor de búsqueda
  });
});

class APIService {
  constructor(urlApi) {
    // Constructor que inicializa la URL de la API
    this.urlApi = urlApi; // Asigna la URL de la API a una propiedad de la instancia
  }

  obtenerActorPorId(id) {
    // Método para obtener un actor por su ID
    const url = `${this.urlApi}/${id}`; // Construye la URL completa para la petición
    console.log("haciendo peticion " + url); // Imprime un mensaje en la consola con la URL de la petición
    return fetch(url) // Realiza una petición fetch a la URL
      .then((response) => response.json()); // Convierte la respuesta a JSON y la retorna
  }
}

class ActorManager {
  constructor(apiService) {
    // Constructor que inicializa el servicio de API
    this.apiService = apiService; // Asigna el servicio de API a una propiedad de la instancia
    this.actores = []; // Inicializa un array vacío para almacenar los actores
    this.idsCargados = new Set(); // Inicializa un conjunto para mantener los IDs de los actores cargados
  }

  actualizarActores(nuevoActor) {
    // Método para actualizar la lista de actores con un nuevo actor
    !this.idsCargados.has(nuevoActor.id) && // Verifica si el ID del nuevo actor no está en el conjunto de IDs cargados
      (this.actores.push(nuevoActor), // Añade el nuevo actor al array de actores
      this.idsCargados.add(nuevoActor.id), // Añade el ID del nuevo actor al conjunto de IDs cargados
      this.actores.sort((a, b) => a.name.localeCompare(b.name))); // Ordena el array de actores alfabéticamente por nombre
  }

  eliminarActor(id) {
    // Método para eliminar un actor por su ID
    this.actores = this.actores.reduce(
      (
        result,
        actor // Filtra el array de actores para excluir el actor con el ID dado
      ) => (actor.id !== id ? result.concat(actor) : result),
      []
    ); // Si el ID del actor no coincide, lo añade al resultado
    this.idsCargados.delete(id); // Elimina el ID del conjunto de IDs cargados
  }

  obtenerActoresDisponibles() {
    // Método para obtener la lista de actores disponibles
    return this.actores; // Retorna el array de actores
  }

  buscarActoresPorNombre(nombre) {
    // Método para buscar actores por nombre
    return this.actores.reduce(
      (
        result,
        actor // Filtra el array de actores para incluir solo aquellos cuyo nombre coincide con la búsqueda
      ) =>
        actor.name.toLowerCase().includes(nombre.toLowerCase())
          ? result.concat(actor)
          : result,
      []
    ); // Si el nombre del actor incluye el término de búsqueda, lo añade al resultado
  }
}

class TablaRenderer {
  constructor(actorManager) {
    this.actorManager = actorManager;
    this.cuerpoTabla = document.querySelector("#actors-table tbody");
    this.elementoConteoActores = document.getElementById("actor-count");
  }

  renderizarTabla(actores) {
    this.cuerpoTabla.replaceChildren(...actores.map(this.crearFila.bind(this)));
    this.actualizarConteoActores(actores.length);
  }

  crearFila(actor) {
    const fila = document.createElement("tr");

    const crearCelda = (contenido) => {
      const celda = document.createElement("td");
      celda.textContent = contenido;
      return celda;
    };

    const accionesCelda = document.createElement("td");

    const verBoton = document.createElement("button");
    verBoton.innerHTML = '<i class="fas fa-eye"></i>'; // Ícono de ojo
    verBoton.onclick = () => tablaActores.verActor(actor.id);
    accionesCelda.appendChild(verBoton);

    const eliminarBoton = document.createElement("button");
    eliminarBoton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícono de basura
    eliminarBoton.onclick = () => tablaActores.eliminarActor(actor.id);
    accionesCelda.appendChild(eliminarBoton);

    fila.append(
      crearCelda(actor.id),
      crearCelda(actor.name),
      crearCelda(actor.awards.join(", ")),
      accionesCelda
    );

    return fila;
  }

  actualizarConteoActores(conteo) {
    this.elementoConteoActores.textContent = `Total de actores: ${conteo}`;
  }
}

class TablaActores {
  constructor(urlApi) {
    // Constructor que inicializa la URL de la API y otras propiedades
    this.apiService = new APIService(urlApi); // Crea una instancia de APIService
    this.actorManager = new ActorManager(this.apiService); // Crea una instancia de ActorManager
    this.tablaRenderer = new TablaRenderer(this.actorManager); // Crea una instancia de TablaRenderer
    this.idsGenerados = this.cargarIdsGenerados(); // Carga los IDs generados desde localStorage
    this.cargarActores(); // Carga los actores desde localStorage
    this.temporizador = null; // Inicializa el temporizador
    this.terminoBusqueda = ""; // Inicializa el término de búsqueda
    this.inicializar(); // Llama al método inicializar
  }

  inicializar() {
    // Método para inicializar la tabla de actores
    window.addEventListener("load", () => {
      // Añade un evento de carga a la ventana
      this.programarActualizacion(); // Llama al método programarActualizacion
    });
  }

  programarActualizacion() {
    // Método para programar la actualización de actores
    this.temporizador && clearTimeout(this.temporizador); // Cancela el temporizador anterior si existe
    this.temporizador = setTimeout(() => this.actualizarActorAleatorio(), 5000); // Programa la actualización después de 5 segundos
  }

  actualizarActorAleatorio() {
    // Método para actualizar un actor aleatorio
    const actorId = this.obtenerIdAleatorio(); // Obtiene un ID aleatorio
    (actorId !== null && // Si el ID no es nulo
      (console.log(`ID generado: ${actorId}`), // Imprime el ID generado en la consola
      this.apiService
        .obtenerActorPorId(actorId)
        .then((actor) => {
          // Obtiene el actor por su ID
          this.actorManager.actualizarActores(actor); // Actualiza la lista de actores
          this.guardarActores(); // Guarda los actores en localStorage
          this.renderizarTabla(); // Renderiza la tabla con los actores disponibles o filtrados
          this.programarActualizacion(); // Programa la siguiente actualización
        })
        .catch((error) => {
          // Maneja errores en la petición
          console.error("Error fetching actor:", error); // Imprime el error en la consola
          this.programarActualizacion(); // Programa la siguiente actualización
        }))) ||
      console.log("No hay más IDs disponibles."); // Si no hay más IDs disponibles, imprime un mensaje en la consola
  }

  obtenerIdAleatorio() {
    // Método para obtener un ID aleatorio
    const idsPosibles = Array.from({ length: 40 }, (_, i) => i + 1); // Crea un array de IDs posibles del 1 al 40
    const idsDisponibles = idsPosibles.reduce(
      (
        result,
        id // Filtra los IDs disponibles
      ) => (!this.idsGenerados.includes(id) ? result.concat(id) : result),
      []
    ); // Si el ID no está en los IDs generados, lo añade al resultado
    const nuevoId =
      idsDisponibles.length > 0
        ? idsDisponibles[Math.floor(Math.random() * idsDisponibles.length)]
        : null; // Selecciona un ID aleatorio de los disponibles
    nuevoId !== null && // Si el nuevo ID no es nulo
      (this.idsGenerados.push(nuevoId), // Añade el nuevo ID a los IDs generados
      this.guardarIdsGenerados(), // Guarda los IDs generados en localStorage
      console.log(`IDs guardados: ${this.idsGenerados.join(", ")}`)); // Imprime los IDs guardados en la consola
    return nuevoId; // Retorna el nuevo ID
  }

  verActor(id) {
    const actor = this.actorManager.actores.find((actor) => actor.id === id);
    const actorDetailsDiv = document.getElementById("actorDetails");
    const modalBackground = document.getElementById("modalBackground");
    actor.death_year = (actor.death_year == undefined) ? "Vivo" : actor.death_year;
    // Mostrar la ventana flotante y el fondo oscuro
    actorDetailsDiv.classList.add("active");
    modalBackground.classList.add("active");

    // Actualiza el contenido del div con los detalles del actor
    actorDetailsDiv.innerHTML = `
      <button id="closeButton" onclick="cerrarDiv()">X</button>
      <p>ID: ${actor.id}</p>
      <h3>Nombre: ${actor.name}</h3>
      <h3>Nacionalidad: ${actor.nationality}</h3>
      <h4>Nacimiento: ${actor.birth_year}</h4>
      <h4>Muerte: ${actor.death_year}</h4>
        <h4>Conocido por: ${actor.known_for.join(", ")}</h4>
        <p>Biografía: ${actor.biography}</p>
      <p>Premios: ${actor.awards.join(", ")}</p>
      <img src="${actor.image}" alt="${actor.name}" width="150">
    `;
  }
  
  

  eliminarActor(id) {
    // Método para eliminar un actor por su ID
    this.actorManager.eliminarActor(id); // Elimina el actor del gestor de actores
    this.idsGenerados = this.idsGenerados.reduce(
      (
        result,
        generatedId // Filtra los IDs generados para excluir el ID eliminado
      ) => (generatedId !== id ? result.concat(generatedId) : result),
      []
    ); // Si el ID generado no coincide, lo añade al resultado
    this.guardarIdsGenerados(); // Guarda los IDs generados en localStorage
    this.guardarActores(); // Guarda los actores en localStorage
    console.log(`ID eliminado: ${id}`); // Imprime el ID eliminado en la consola
    console.log(
      `IDs guardados después de eliminar: ${this.idsGenerados.join(", ")}`
    ); // Imprime los IDs guardados después de eliminar en la consola
    this.renderizarTabla(); // Renderiza la tabla con los actores disponibles o filtrados
    this.programarActualizacion(); // Programa la siguiente actualización después de 5 segundos
  }

  buscarActorPorNombre(nombre) {
    // Método para buscar actores por nombre
    this.terminoBusqueda = nombre; // Almacena el término de búsqueda actual
    this.renderizarTabla(); // Renderiza la tabla con los actores filtrados
  }

  renderizarTabla() {
    // Método para renderizar la tabla
    const actores = this.terminoBusqueda // Si hay un término de búsqueda
      ? this.actorManager.buscarActoresPorNombre(this.terminoBusqueda) // Filtra los actores por nombre
      : this.actorManager.obtenerActoresDisponibles(); // Obtiene todos los actores disponibles
    this.tablaRenderer.renderizarTabla(actores); // Renderiza la tabla con los actores
  }

  guardarIdsGenerados() {
    // Método para guardar los IDs generados en localStorage
    this.idsGenerados.length >= 40 && (this.idsGenerados = []); // Si hay 40 o más IDs generados, los vacía
    localStorage.setItem("idsGenerados", JSON.stringify(this.idsGenerados)); // Guarda los IDs generados en localStorage
  }

  cargarIdsGenerados() {
    // Método para cargar los IDs generados desde localStorage
    return JSON.parse(localStorage.getItem("idsGenerados") || "[]"); // Retorna los IDs generados desde localStorage o un array vacío si no hay ninguno
  }

  guardarActores() {
    // Método para guardar los actores en localStorage
    localStorage.setItem(
      "actores",
      JSON.stringify(this.actorManager.obtenerActoresDisponibles())
    ); // Guarda los actores disponibles en localStorage
  }

  cargarActores() {
    // Método para cargar los actores desde localStorage
    const actoresGuardados = JSON.parse(
      localStorage.getItem("actores") || "[]"
    ); // Carga los actores guardados desde localStorage o un array vacío si no hay ninguno
    actoresGuardados.map((actor) => this.actorManager.actualizarActores(actor)); // Actualiza la lista de actores con los actores guardados
    this.renderizarTabla(); // Renderiza la tabla después de cargar los actores
  }

}
function cerrarDiv() {
    const actorDetailsDiv = document.getElementById("actorDetails");
    const modalBackground = document.getElementById("modalBackground");
  
    // Ocultar la ventana flotante y el fondo oscuro
    actorDetailsDiv.classList.remove("active");
    modalBackground.classList.remove("active");
  }
function verGrafico() {
    const ctx = document.getElementById("miGrafica").getContext("2d");
    const miGrafica = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Padma Shri","BAFTA", "Filmfare Award" ,"National Film Award" ,"Honorary Oscar", "Golden Horse Award", "Emmy" ,"Golden Globe", "Oscar"],
        datasets: [
          {
            label: "Premios",
            data: [1, 1, 1, 1, 1, 1, 1, 1, 10],
            backgroundColor: ["#b87333", "#87EBA2", "gold", "#e5e4e2","#0526BA", "#8A2BE2","#0B9912","#990B2C","#FC8A00"],
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
  function clearLocalStorage() {
    confirm('¿Estás seguro de que deseas borrar todo el Local Storage? Esta acción no se puede deshacer.') 
      && (localStorage.clear(), alert('Local Storage ha sido borrado.'));
  }
  
  verGrafico();
/* 
Falta mejorar la grafica para que muestre los premios en tiempo real
Poder eliminar todos los actores de una vez para iniciar desde 0
Meter las funciones que cree en una clase
*/