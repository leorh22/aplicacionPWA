import { graficoPastel, graficoBarras, graficoLinea, graficoIngresos, graficoRadar } from "./graficas.js";
import { inicializarFiltros } from "./filtros.js";

const API_URL = "http://localhost:3000/api/gastos";
/*const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api/gastos"
  : "https://aplicacionpwa.onrender.com/api/gastos";*/

const API_PRESUPUESTOS = '/api/presupuestos';
const form = document.getElementById("formGasto");
const popup = document.getElementById("popup");
const tituloPopup = document.getElementById("tituloPopup");
const btnAgregar = document.getElementById("btnAgregar");
const cancelar = document.getElementById("cancelar");
const VAPID_PUBLIC_KEY = "BDPYzCO5bWNreov9MkSPmoFdHy2XDv8zN8MzX0TKF2_hJYDlPQKOv1ONBOVvuRAezMpRPd0SCRXz0-wOb6RpM1k";
const alertas = [];

// Elemento <tbody> de la tabla
const tabla = document.querySelector("#tablaGastos tbody");

let editando = false;
let gastoId = null;
let gastosGlobal = [];
let datosGlobales = []; // Donde almacenarás los datos completos del backend
window.gastosGlobal = gastosGlobal;
let filtrosIniciados = false;

const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");
const frecuenciaSelect = document.getElementById("frecuencia");
const labelFrecuencia = document.getElementById("labelFrecuencia");

// Descarga genérica
function descargarArchivo(nombreArchivo, contenido, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Registro correcto del Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      // OJO: SLASH AL INICIO
      .register("/service-worker.js")
      .then(reg => {
        console.log("Service Worker registrado:", reg.scope);
      })
      .catch(err => {
        console.error("Error al registrar SW:", err);
      });
  });
}

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


// ---------- PINTAR SOLO LA TABLA DE GASTOS ----------
function pintarTabla(gastos) {
  // Limpiar tabla
  tabla.innerHTML = "";

  if (!gastos || gastos.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `<td colspan="7" style="text-align:center;">No hay registros</td>`;
    tabla.appendChild(filaVacia);
    return;
  }

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
}

// disponible para filtros.js
window.pintarTabla = pintarTabla;

/*async function mostrarGastos() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    const gastos = await respuesta.json();
    gastosGlobal = gastos; // guardar en global para usar en presupuesto, filtros, etc.
    
    // Limpiar tabla
    tabla.innerHTML = "";

    if (gastos.length === 0) {
      const filaVacia = document.createElement("tr");
      // 7 columnas: #, desc, tipo, cat, monto, fecha, acciones
      filaVacia.innerHTML = `<td colspan="7" style="text-align:center;">No hay registros</td>`;
      tabla.appendChild(filaVacia);

      if (typeof cargarPresupuesto === "function") {
        cargarPresupuesto();
      }
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
      revisarPagosProximos(gastos);

      if (typeof cargarPresupuesto === "function") {
        cargarPresupuesto();
      }
    }

  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    Swal.fire({
      icon: "error",
      title: "Error al cargar datos",
      text: "No se pudieron obtener los registros del servidor."
    });
  }
} */

async function mostrarGastos() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    const gastos = await respuesta.json();

    // Guardar globalmente para filtros y presupuesto
    gastosGlobal = gastos;
    window.gastosGlobal = gastosGlobal;

    // Pintar la tabla completa
    pintarTabla(gastosGlobal);

    // Inicializar filtros SOLO la primera vez, ya con datos cargados
    if (!filtrosIniciados) {
      inicializarFiltros();
      filtrosIniciados = true;
    }

    if (gastos.length > 0) {
      graficoPastel(gastos);
      graficoBarras(gastos);
      graficoLinea(gastos);
      graficoIngresos(gastos);
      graficoRadar(gastos);
      mostrarRecurrentes(gastos);
      revisarPagosProximos(gastos);
    } else {
      // si no hay datos, limpiar tabla de recurrentes
      mostrarRecurrentes([]);
    }

    if (typeof cargarPresupuesto === "function") {
      cargarPresupuesto();
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
//inicializarFiltros(datos, mostrarGastos);



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

  // cada vez que cambias el tipo, escondemos frecuencia
  frecuenciaSelect.style.display = "none";
  labelFrecuencia.style.display = "none";
  frecuenciaSelect.value = "";
});

// Mostrar frecuencia solo si aplica (UN SOLO LISTENER)
categoriaSelect.addEventListener("change", () => {
  const categoria = categoriaSelect.value;
  const categoriasRecurrentes = ["Suscripciones", "Renta", "Pago de Tarjeta"];

  if (categoriasRecurrentes.includes(categoria)) {
    frecuenciaSelect.style.display = "block";
    labelFrecuencia.style.display = "block";
  } else {
    frecuenciaSelect.style.display = "none";
    labelFrecuencia.style.display = "none";
    frecuenciaSelect.value = "";
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

function revisarPagosProximos(gastos) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Filtramos solo suscripciones con fecha válida y a 0–3 días de distancia
  const proximos = gastos.filter((g) => {
    if (g.categoria !== "Suscripciones" || !g.fecha) return false;

    const fechaPago = new Date(g.fecha);
    fechaPago.setHours(0, 0, 0, 0);

    const diffMs = fechaPago - hoy;
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDias >= 0 && diffDias <= 3;
  });

  if (proximos.length === 0) return;

  // Armamos un listado en HTML
  const listaHtml = proximos
    .map((g) => {
      const fechaTexto = new Date(g.fecha).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return `<li><strong>${g.descripcion}</strong> · vence el ${fechaTexto}</li>`;
    })
    .join("");

  Swal.fire({
    icon: "info",
    title: "Suscripciones próximas a cobrarse",
    html: `<ul style="text-align:left; padding-left:20px;">${listaHtml}</ul>`,
    confirmButtonText: "Entendido",
  });
}

navigator.serviceWorker.ready.then(reg => {
  reg.showNotification("FinTrack", {
    body: "¡Gracias por volver con nosotros!",
    icon: "../icons/FinTrack-icon.png",
  });
});


// --------- PRESUPUESTO MENSUAL ---------
const presupuestoResumen = document.getElementById("presupuestoResumen");
const btnAgregarPresupuesto = document.getElementById("btnAgregarPresupuesto");
const popupPresupuesto = document.getElementById("popupPresupuesto");
const formPresupuesto = document.getElementById("formPresupuesto");
const cancelarPresupuesto = document.getElementById("cancelarPresupuesto");
const presTipo = document.getElementById("presTipo");
const campoCategoriaPresupuesto = document.getElementById("campoCategoriaPresupuesto");
const presCategoriaInput = document.getElementById("presCategoria");
const presMontoInput = document.getElementById("presMonto");  
const presIdInput = document.getElementById("presId");      

// Mostrar/ocultar campo categoría según tipo de presupuesto
presTipo.addEventListener("change", () => {
  if (presTipo.value === "categoria") {
    campoCategoriaPresupuesto.style.display = "block";
  } else {
    campoCategoriaPresupuesto.style.display = "none";
    presCategoriaInput.value = "";
  }
});

// Abrir popup
btnAgregarPresupuesto?.addEventListener("click", () => {
  formPresupuesto.reset();
  presTipo.value = "general";
  campoCategoriaPresupuesto.style.display = "none";
  popupPresupuesto.style.display = "flex";
});

// Cerrar popup
cancelarPresupuesto?.addEventListener("click", () => {
  popupPresupuesto.style.display = "none";
});

// Guardar / actualizar presupuesto del mes actual
formPresupuesto?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const año = hoy.getFullYear();

  const tipo = presTipo.value;
  let categoria = presCategoriaInput.value.trim();

  if (tipo === "general") {
    categoria = "GENERAL"; // categoría especial para presupuesto total del mes
  } else if (!categoria) {
    Swal.fire("Datos inválidos", "Ingresa una categoría para el presupuesto.", "warning");
    return;
  }

  const monto = parseFloat(document.getElementById("presMonto").value);

  if (isNaN(monto) || monto <= 0) {
    Swal.fire("Datos inválidos", "El monto debe ser mayor a 0.", "warning");
    return;
  }

  try {
    const respuesta = await fetch(API_PRESUPUESTOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria, monto, mes, año })
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      console.error("Error al guardar presupuesto:", respuesta.status, errorData);
      throw new Error("Error al guardar presupuesto");
    }

    Swal.fire({
      icon: "success",
      title: "Presupuesto guardado",
      timer: 1500,
      showConfirmButton: false
    });

    popupPresupuesto.style.display = "none";
    cargarPresupuesto(); // recalcular resumen

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo guardar el presupuesto.", "error");
  }
});

// Calcula y muestra el resumen del presupuesto del mes actual
async function cargarPresupuesto() {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const año = hoy.getFullYear();

    const res = await fetch(`${API_PRESUPUESTOS}?mes=${mes}&anio=${año}`);
    if (!res.ok) throw new Error("Error al obtener presupuesto");
    const presupuestos = await res.json();

    // Si no hay presupuestos
    if (!presupuestos || presupuestos.length === 0) {
      presupuestoResumen.textContent = "Aún no has definido un presupuesto para este mes.";
      return;
    }

    const gastos = Array.isArray(gastosGlobal) ? gastosGlobal : [];

    // Calcular total general (si existe) y por categoría
    let totalGeneral = 0;
    let totalGastadoGeneral = 0;
    const lineas = [];

    // Filtramos gastos del mes actual
    const gastosMes = gastos.filter(g => {
      const f = new Date(g.fecha);
      return (
        g.tipo === "Gasto" &&
        f.getMonth() + 1 === mes &&
        f.getFullYear() === año
      );
    });

    // Procesar cada presupuesto
    presupuestos.forEach((p) => {
      const esGeneral = p.categoria === "GENERAL";

      const gastado = gastosMes
        .filter(g => esGeneral || g.categoria === p.categoria)
        .reduce((sum, g) => sum + g.monto, 0);

      if (esGeneral) {
        totalGeneral += p.monto;
        totalGastadoGeneral += gastado;
      }

      const restante = p.monto - gastado;
      const porcentaje = p.monto > 0 ? Math.min(100, (gastado / p.monto) * 100) : 0;

      const colorBarra =
        porcentaje >= 100 ? "#c0392b" :
        porcentaje >= 80  ? "#e67e22" :
        "#27ae60";

      lineas.push(`
      <div style="margin-bottom:6px;">
        <strong>${esGeneral ? "General (todo el mes)" : p.categoria}</strong>: 
        presupuesto $${p.monto.toFixed(2)} · gastado $${gastado.toFixed(2)} · restante $${restante.toFixed(2)}
        <div style="background:#e5e9f2; border-radius:6px; overflow:hidden; margin-top:2px;">
          <div style="width:${porcentaje}%; max-width:100%; height:6px; background:${colorBarra};"></div>
        </div>
      </div>
    `);
    });

    const totalRestanteGeneral = totalGeneral - totalGastadoGeneral;

     if (alertas.length > 0) {
      const htmlAlertas = alertas
        .map(msg => `<li>${msg}</li>`)
        .join("");

      Swal.fire({
        icon: "warning",
        title: "Avisos de presupuesto",
        html: `<ul style="text-align:left; padding-left:20px;">${htmlAlertas}</ul>`,
        confirmButtonText: "Revisar gastos",
      });
    }

    presupuestoResumen.innerHTML = `
      <div style="margin-bottom:8px;">
        <strong>Resumen del mes actual:</strong><br>
        Presupuesto general: $${totalGeneral.toFixed(2)} · Gastado: $${totalGastadoGeneral.toFixed(2)} · Restante: $${totalRestanteGeneral.toFixed(2)}
      </div>
      ${lineas.join("")}
    `;
  } catch (err) {
    console.error("Error al cargar presupuesto:", err);
    presupuestoResumen.textContent = "No se pudo cargar el presupuesto.";
  }
}

function exportarTablaCSV() {
  const tbody = document.querySelector("#tablaGastos tbody");
  const filas = Array.from(tbody.querySelectorAll("tr"));

  if (filas.length === 0) {
    Swal.fire("Sin datos", "No hay registros para exportar.", "info");
    return;
  }

  const encabezados = ["#", "Descripción", "Tipo", "Categoría", "Monto", "Fecha"];
  const lineas = [];

  // Agregar encabezados
  lineas.push(encabezados.join(","));

  // Recorrer filas (ignoramos filas que solo dicen "No hay registros")
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    if (celdas.length < 6) return; // probablemente es la fila de "No hay registros"

    const valores = [];
    // Tomamos las primeras 6 columnas: #, desc, tipo, cat, monto, fecha
    for (let i = 0; i < 6; i++) {
      let texto = celdas[i].innerText.trim();
      // Escapar comillas dobles
      texto = texto.replace(/"/g, '""');
      // En CSV, envolver cada campo entre comillas
      valores.push(`"${texto}"`);
    }
    lineas.push(valores.join(","));
  });

  const csv = lineas.join("\r\n");
  descargarArchivo("gastos.csv", csv, "text/csv;charset=utf-8;");
}

function exportarTablaExcel() {
  const tbody = document.querySelector("#tablaGastos tbody");
  const filas = Array.from(tbody.querySelectorAll("tr"));

  if (filas.length === 0) {
    Swal.fire("Sin datos", "No hay registros para exportar.", "info");
    return;
  }

  const encabezados = ["#", "Descripción", "Tipo", "Categoría", "Monto", "Fecha"];

  let html = `<table border="1">
    <thead>
      <tr>${encabezados.map(h => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
  `;

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    if (celdas.length < 6) return;

    html += "<tr>";
    for (let i = 0; i < 6; i++) {
      let texto = celdas[i].innerText.trim();
      html += `<td>${texto}</td>`;
    }
    html += "</tr>";
  });

  html += "</tbody></table>";

  descargarArchivo(
    "gastos.xls",
    html,
    "application/vnd.ms-excel;charset=utf-8;"
  );
}

const btnExportCSV = document.getElementById("btnExportCSV");
const btnExportExcel = document.getElementById("btnExportExcel");

if (btnExportCSV) {
  btnExportCSV.addEventListener("click", exportarTablaCSV);
}

if (btnExportExcel) {
  btnExportExcel.addEventListener("click", exportarTablaExcel);
}

// Ejecutar cuando cargue la página
mostrarGastos();

