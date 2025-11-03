import { graficoPastel, graficoBarras, graficoLinea, graficoIngresos, graficoRadar } from "./graficas.js";
import { inicializarFiltros } from "./filtros.js";

//const API_URL = "http://localhost:3000/api/gastos";
const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api/gastos"
  : "https://<tu-nombre-backend>.onrender.com/api/gastos";

const form = document.getElementById("formGasto");
const popup = document.getElementById("popup");
const tituloPopup = document.getElementById("tituloPopup");
const btnAgregar = document.getElementById("btnAgregar");
const cancelar = document.getElementById("cancelar");

// Elemento <tbody> de la tabla
const tabla = document.querySelector("#tablaGastos tbody");

let editando = false;
let gastoId = null;
let gastosGlobal = [];
let datosGlobales = []; // Donde almacenarás los datos completos del backend

// Función principal: obtiene y muestra los registros

const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");
const frecuenciaSelect = document.getElementById("frecuencia");
const labelFrecuencia = document.getElementById("labelFrecuencia");


categoriaSelect.addEventListener("change", () => {
  const categoria = categoriaSelect.value;
  if (categoria === "Suscripciones") {
    frecuenciaSelect.style.display = "block";
    labelFrecuencia.style.display = "block";
  } else {
    frecuenciaSelect.style.display = "none";
    labelFrecuencia.style.display = "none";
    frecuenciaSelect.value = "";
  }
});

async function mostrarGastos() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    const gastos = await respuesta.json();

    // Limpiar tabla
    tabla.innerHTML = "";

    if (gastos.length === 0) {
      const filaVacia = document.createElement("tr");
      filaVacia.innerHTML = `<td colspan="6" style="text-align:center;">No hay registros</td>`;
      tabla.appendChild(filaVacia);
      return;
    }

    // Llenar tabla con los datos
    gastos.forEach((gasto, index) => {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td style="text-align: center;">${index + 1}</td>
    <td>${gasto.descripcion}</td>
    <td style="text-align: center;">${gasto.tipo}</td>
    <td style="text-align: center;">${gasto.categoria}</td>
    <td style="text-align: center;">$${gasto.monto.toFixed(2)}</td>
    <td style="text-align: center;">${new Date(gasto.fecha).toLocaleDateString("es-MX")}</td>
    <td style="text-align: center;">
      <button class="editar" onclick="editarGasto('${gasto._id}')">Editar</button>
      <button class="eliminar" onclick="eliminarGasto('${gasto._id}')">Eliminar</button>
    </td>
  `;
  tabla.appendChild(fila);
  });

    if (gastos.length > 0) {
      graficoPastel(gastos);
      graficoBarras(gastos);
      graficoLinea(gastos);
      graficoIngresos(gastos);
      graficoRadar(gastos); 
      mostrarRecurrentes(gastos);
    }

  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    Swal.fire({
      icon: "error",
      title: "Error al cargar datos",
      text: "No se pudieron obtener los registros del servidor."
    });
  }
} 

function calcularTiempoRestante(fechaObjetivo) {
  const ahora = new Date();
  const objetivo = new Date(fechaObjetivo);
  const diffMs = objetivo - ahora;

  if (diffMs <= 0) return "Vencido";

  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const meses = Math.floor(diffDias / 30);
  const dias = diffDias % 30;

  if (meses > 0 && dias > 0) return `${meses} mes${meses > 1 ? "es" : ""} ${dias} día${dias > 1 ? "s" : ""}`;
  if (meses > 0) return `${meses} mes${meses > 1 ? "es" : ""}`;
  return `${dias} día${dias > 1 ? "s" : ""}`;
}


function mostrarRecurrentes(gastos) {
  const tabla = document.querySelector("#tablaRecurrentes tbody");
  tabla.innerHTML = "";

  // Filtrar solo los que tienen frecuencia asignada
  const recurrentes = gastos.filter(g => g.frecuencia && g.frecuencia !== "");

  if (recurrentes.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `<td colspan="7" style="text-align:center;">No hay pagos recurrentes</td>`;
    tabla.appendChild(filaVacia);
    return;
  }

  recurrentes.forEach((g, i) => {
    const proximo = g.fechaRenovacion
      ? new Date(g.fechaRenovacion).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric"
      })
  :   "—";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td style="text-align:center;">${i + 1}</td>
      <td>${g.descripcion}</td>
      <td style="text-align:center;">${g.categoria}</td>
      <td style="text-align:center;">$${g.monto.toFixed(2)}</td>
      <td style="text-align:center;">${g.frecuencia}</td>
      <td style="text-align:center;">${proximo}</td>
    `;
    tabla.appendChild(fila);
  });
}


const respuesta = await fetch(API_URL);
const datos = await respuesta.json();
// mostrarGastos(datos) ya la tienes
inicializarFiltros(datos, mostrarGastos);



async function inicializarGraficas() {
  try {
    const respuesta = await fetch(API_URL);
    datosGlobales = await respuesta.json();

    // Poblar selector de año
    const selectAnio = document.getElementById("filtroAnio");
    const anios = [...new Set(datosGlobales.map(d => new Date(d.fecha).getFullYear()))].sort((a, b) => b - a);

    selectAnio.innerHTML = "";
    const optTodos = document.createElement("option");
    optTodos.value = "Todos";
    optTodos.textContent = "Todos";
    selectAnio.appendChild(optTodos);

    anios.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      selectAnio.appendChild(opt);
    });

    // Mostrar gráficas por defecto (Todos los años)
    graficoBarras(datosGlobales);
    graficoLinea(datosGlobales);

    // Evento: cambio de año
    selectAnio.addEventListener("change", () => {
      const anioSel = selectAnio.value;

      const datosFiltrados =
        anioSel === "Todos"
          ? datosGlobales
          : datosGlobales.filter(d => new Date(d.fecha).getFullYear() === parseInt(anioSel));

      graficoBarras(datosFiltrados);
      graficoLinea(datosFiltrados);
    });
  } catch (err) {
    console.error("Error al cargar datos para gráficas:", err);
  }
}

inicializarGraficas();

async function mostrarGastosDesdeServidor() {
  const res = await fetch("/api/gastos");
  const datos = await res.json();
  gastosGlobal = datos;
  mostrarGastos(gastosGlobal);

  graficoPastel(gastosGlobal);  
  graficoBarras(gastosGlobal);
  graficoLinea(gastosGlobal);

  // Inicializar los filtros (solo una vez)
  //inicializarFiltros(gastosGlobal, mostrarGastos);
}

mostrarGastosDesdeServidor();

// Categorías dinámicas según el tipo
const categorias = {
  Gasto: [
    "Comida",
    "Transporte",
    "Entretenimiento",
    "Suscripciones",
    "Salud",
    "Educación",
    "Ropa",
    "Hogar",
    "Otros"
  ],
  Ingreso: [
    "Salario",
    "Freelance",
    "Inversiones",
    "Regalos",
    "Otros"
  ]
};

// Cambia las categorías al seleccionar tipo
tipoSelect.addEventListener("change", () => {
  const tipo = tipoSelect.value;
  categoriaSelect.innerHTML = '<option value="">Selecciona categoría</option>';

  if (categorias[tipo]) {
    categorias[tipo].forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });
  }
});

btnAgregar.onclick = () => {
  form.reset();
  editando = false;
  gastoId = null;
  tituloPopup.textContent = "Agregar registro";
  popup.style.display = "flex";
};

cancelar.onclick = () => {
  popup.style.display = "none";
};

form.onsubmit = async (e) => {
  e.preventDefault();

  // Obtener valores del formulario
  const fechaBase = new Date(document.getElementById("fecha").value);
  const frecuencia = form.frecuencia ? form.frecuencia.value : "";

  // Calcular la próxima fecha de pago (fechaRenovacion)
  let fechaRenovacion = null;
  if (frecuencia) {
    fechaRenovacion = new Date(fechaBase);
    if (frecuencia === "Semanal") fechaRenovacion.setDate(fechaBase.getDate() + 7);
    if (frecuencia === "Mensual") fechaRenovacion.setMonth(fechaBase.getMonth() + 1);
    if (frecuencia === "Anual") fechaRenovacion.setFullYear(fechaBase.getFullYear() + 1);
  }

  const nuevoGasto = {
    tipo: tipoSelect.value,
    categoria: categoriaSelect.value,
    descripcion: document.getElementById("descripcion").value,
    monto: parseFloat(document.getElementById("monto").value),
    fecha: document.getElementById("fecha").value,
    frecuencia: frecuencia,
    fechaRenovacion: fechaRenovacion ? fechaRenovacion.toISOString() : null
  };

  try {
    let respuesta;
    if (editando) {
      // PATCH para editar
      respuesta = await fetch(`${API_URL}/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto)
      });
    } else {
      // POST para agregar
      respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto)
      });
    }

    if (!respuesta.ok) throw new Error("Error al guardar");

    Swal.fire({
      icon: "success",
      title: editando ? "Registro actualizado" : "Registro agregado",
      timer: 1500,
      showConfirmButton: false
    });

    popup.style.display = "none";
    mostrarGastos(); // recargar tabla

  } catch (error) {
    console.error("Error al guardar registro:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el registro."
    });
  }
};

window.editarGasto = async (id) => {
  try {
    const res = await fetch(API_URL);
    const datos = await res.json();
    const gasto = datos.find(g => g._id === id);
    if (!gasto) return;

    // Llenar el formulario con los datos existentes
    gastoId = gasto._id;
    tipoSelect.value = gasto.tipo;

    // Actualizar opciones de categoría según tipo
    categoriaSelect.innerHTML = '<option value="">Selecciona categoría</option>';
    categorias[gasto.tipo].forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });

    categoriaSelect.value = gasto.categoria;
    document.getElementById("descripcion").value = gasto.descripcion;
    document.getElementById("monto").value = gasto.monto;
    document.getElementById("fecha").value = gasto.fecha ? gasto.fecha.split("T")[0] : "";

    tituloPopup.textContent = "Editar registro";
    editando = true;
    popup.style.display = "flex";
  } catch (error) {
    console.error("Error al editar registro:", error);
    Swal.fire("Error", "No se pudo obtener el registro", "error");
  }
};

window.eliminarGasto = async (id) => {
  const confirmacion = await Swal.fire({
    title: "¿Eliminar este registro?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");

    Swal.fire({
      icon: "success",
      title: "Registro eliminado",
      timer: 1500,
      showConfirmButton: false
    });

    mostrarGastos(); // refrescar tabla
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar el registro."
    });
  }
};

// Mostrar frecuencia solo si aplica
categoriaSelect.addEventListener("change", () => {
  const categoria = categoriaSelect.value;
  const categoriasRecurrentes = ["Suscripciones", "Renta", "Pago de Tarjeta"];

  if (categoriasRecurrentes.includes(categoria)) {
    frecuenciaSelect.parentElement.style.display = "block";
  } else {
    frecuenciaSelect.value = "";
    frecuenciaSelect.parentElement.style.display = "none";
  }
});

// Ejecutar cuando cargue la página
mostrarGastos();

