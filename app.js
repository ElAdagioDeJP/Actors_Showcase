class TablaActores {
    constructor(urlApi) {
        this.urlApi = urlApi; // URL de la API para obtener los actores
        this.actores = []; // Array para almacenar los actores
        this.idsActoresEliminados = new Set(); // Conjunto para almacenar los IDs de actores eliminados
        this.cuerpoTabla = document.querySelector('#actors-table tbody'); // Referencia al cuerpo de la tabla en el DOM
        this.inputBusqueda = document.getElementById('search'); // Referencia al input de búsqueda en el DOM
        this.elementoConteoActores = document.getElementById('actor-count'); // Referencia al elemento que muestra el conteo de actores
        this.consultaActual = ''; // Cadena para almacenar la consulta de búsqueda actual
        this.inicializar(); // Llama al método inicializar para inicializar la tabla
    }

    inicializar() {
        this.obtenerActores(); // Obtiene los actores de la API
        this.configurarBusqueda(); // Configura el input de búsqueda
        setInterval(() => this.obtenerActores(), 5000); // Actualiza los actores cada 5 segundos
    }

    obtenerActores() {
        fetch(this.urlApi)
            .then(response => response.json()) // Convierte la respuesta a JSON
            .then(data => {
                const actoresDisponibles = data.filter(actor => !this.idsActoresEliminados.has(actor.id)); // Filtra los actores eliminados
                const actoresAleatorios = this.obtenerActoresAleatorios(actoresDisponibles, 40); // Obtiene 40 actores aleatorios
                this.actualizarActores(actoresAleatorios); // Actualiza la lista de actores
            })
            .catch(console.error); // Maneja errores en la consola
    }

    obtenerActorAleatorio() {
        return fetch(this.urlApi)
            .then(response => response.json()) // Convierte la respuesta a JSON
            .then(data => {
                const actoresDisponibles = data.filter(actor => !this.idsActoresEliminados.has(actor.id)); // Filtra los actores eliminados
                const actorAleatorio = this.obtenerActoresAleatorios(actoresDisponibles, 1)[0]; // Obtiene un actor aleatorio
                return actorAleatorio; // Retorna el actor aleatorio
            })
            .catch(console.error); // Maneja errores en la consola
    }

    actualizarActores(data) {
        this.actores = data.sort((a, b) => a.name.localeCompare(b.name)); // Ordena los actores por nombre
        this.renderizarTabla(); // Renderiza la tabla
        this.actualizarConteoActores(); // Actualiza el conteo de actores
    }

    obtenerActoresAleatorios(data, cantidad) {
        const mezclados = data.sort(() => 0.5 - Math.random()); // Mezcla los actores aleatoriamente
        return mezclados.slice(0, cantidad); // Retorna los primeros 'cantidad' actores
    }

    renderizarTabla() {
        const actoresFiltrados = this.actores.filter(actor =>
            actor.name.toLowerCase().includes(this.consultaActual) // Filtra los actores según la consulta de búsqueda
        );
        this.cuerpoTabla.innerHTML = ''; // Limpia el cuerpo de la tabla
        actoresFiltrados.forEach(actor => this.cuerpoTabla.appendChild(this.crearFila(actor))); // Agrega filas para cada actor
        this.actualizarConteoActores(); // Asegura que el contador se actualice después de renderizar la tabla
    }

    crearFila(actor) {
        const fila = document.createElement('tr'); // Crea un elemento de fila
        const premios = actor.awards.join(', '); // Une los premios del actor en una cadena
        fila.innerHTML = `
            <td>${actor.id}</td>
            <td>${actor.name}</td>
            <td>${premios}</td>
            <td>
                <button onclick="tablaActores.verActor(${actor.id})">Ver</button>
                <button onclick="tablaActores.eliminarActor(${actor.id})">Eliminar</button>
            </td>
        `; // ESTE HTML SE TIENE QUE QUITAR YA QUE NO PUEDE HABER HTML EN EL JS
        return fila; // Retorna la fila creada
    }

    verActor(id) {
        const actor = this.actores.find(actor => actor.id === id); // Encuentra el actor por ID
        alert(`Nombre: ${actor.name}\nPremios: ${actor.awards.join(', ')}\nDetalles: ${JSON.stringify(actor)}`); // Muestra una alerta con los detalles del actor
    }

    eliminarActor(id) {
        this.actores = this.actores.filter(actor => actor.id !== id); // Filtra el actor eliminado de la lista
        this.idsActoresEliminados.add(id); // Agrega el ID del actor eliminado al conjunto
        this.rellenarActores(); // Rellena la lista de actores
    }

    rellenarActores() {
        const cantidadRelleno = 40 - this.actores.length; // Calcula cuántos actores faltan para llegar a 40
        const promesasFetch = Array.from({ length: cantidadRelleno }, () => this.obtenerActorAleatorio()); // Crea un array de promesas para obtener actores aleatorios

        Promise.all(promesasFetch)
            .then(nuevosActores => {
                this.actores = this.actores.concat(nuevosActores); // Agrega los nuevos actores a la lista
                this.renderizarTabla(); // Renderiza la tabla después de agregar nuevos actores
                this.actualizarConteoActores(); // Actualiza el conteo de actores
            })
            .catch(console.error); // Maneja errores en la consola
    }

    configurarBusqueda() {
        this.inputBusqueda.addEventListener('input', this.actualizarResultadosBusqueda.bind(this)); // Agrega un evento de input al input de búsqueda
    }

    actualizarResultadosBusqueda(event) {
        this.consultaActual = event.target.value.toLowerCase(); // Actualiza la consulta de búsqueda
        this.renderizarTabla(); // Renderiza la tabla con los resultados filtrados
    }

    actualizarConteoActores() {
        this.elementoConteoActores.textContent = this.actores.length; // Actualiza el texto del elemento de conteo de actores
    }
}

// Instancia de la clase TablaActores con la URL de la API
const tablaActores = new TablaActores('https://freetestapi.com/api/v1/actors');

//Cosas pendientes:Mejorar las busqueda por nombre,arreglar el contador por alguna razon nose actualiza cuando se agregar otravez un actor,
//los actores eliminados se guardan un array y no deberian volver a aparecer en la tabla(no estoy seguro si esta bien asi),quitar el html del js,
//mejorar el diseño de la tabla y los botones de ver y eliminar, cuando le das ver se ve su informacion en una alerta pero se necesita mejorar y 
//se debe ver la imagen del actor y la informacion este organizada,agregar los graficos(IMPORTANTE), agregar mucho ccs posiblemente librerias para que se vea bien, 
//sesto es todo hasta el momento habra cambios en el fututo
