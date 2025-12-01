import { graficoPastel, graficoBarras, graficoLinea, graficoIngresos, graficoRadar } from "./graficas.js";
import { inicializarFiltros } from "./filtros.js";
import { guardarOffline, obtenerOffline, limpiarOffline } from "./db.js";

const LS_OFFLINE_KEY = "gastosOfflinePendientes";

//const API_URL = "http://localhost:3000/api/gastos";
//const API_PRESUPUESTOS = "/api/presupuestos";
//const API_AUTH_LOGIN = "/api/auth/login";

/*const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000/api/gastos"
  : "https://aplicacionpwa.onrender.com/api/gastos";*/

const API_BASE_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"                // backend local
  : "https://aplicacionpwa.onrender.com";  // backend en Render

const API_URL = `${API_BASE_URL}/api/gastos`;
const API_PRESUPUESTOS = `${API_BASE_URL}/api/presupuestos`;
const API_AUTH_LOGIN = `${API_BASE_URL}/api/auth/login`;
//const API_PRESUPUESTOS = "/api/presupuestos";
//const API_AUTH_LOGIN = "/api/auth/login";

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
let alertaPresupuestoEnviada = false;
let alertaSubs3DiasEnviada = false;
let alertaSubsHoyEnviada = false;

const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");
const frecuenciaSelect = document.getElementById("frecuencia");
const labelFrecuencia = document.getElementById("labelFrecuencia");

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function suscribirDesdeFrontend() {
  try {
    const reg = await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("➡️ Suscripción creada en el navegador:", subscription);

    await apiFetch("/api/notificaciones/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    console.log("✅ Suscripción enviada al backend");
  } catch (err) {
    console.error("Error al suscribir a push:", err);
  }
}

if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
  if (Notification.permission === "default") {
    Notification.requestPermission().then((result) => {
      console.log("Permiso de notificaciones:", result);
      if (result === "granted") {
        suscribirDesdeFrontend();
      }
    });
  } else if (Notification.permission === "granted") {
    // Si ya habías dado permiso antes, nos suscribimos directo
    suscribirDesdeFrontend();
  } else {
    console.log("Notificaciones bloqueadas por el usuario");
  }
}

function cargarPendientesLocal() {
  try {
    const data = localStorage.getItem(LS_OFFLINE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error leyendo pendientes de localStorage:", e);
    return [];
  }
}

/**
 * Guarda una operación pendiente para sincronizar luego.
 * operacion = {
 *   accion: "crear" | "editar" | "eliminar",
 *   id?: string,         // solo para editar / eliminar
 *   gasto?: object       // datos del gasto (para crear / editar)
 * }
 */
function guardarPendienteLocal(operacion) {
  const actuales = cargarPendientesLocal();
  actuales.push(operacion);
  localStorage.setItem(LS_OFFLINE_KEY, JSON.stringify(actuales));
}

function limpiarPendientesLocal() {
  localStorage.removeItem(LS_OFFLINE_KEY);
}

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

async function mostrarGastos() {
  try {
    const respuesta = await apiFetch(API_URL);

    if (!respuesta.ok) {
      // Esto nos ayuda a entender qué pasa exactamente
      const textoError = await respuesta.text().catch(() => "");
      console.error("Fallo GET /api/gastos:", respuesta.status, textoError);

      // Si es sesión expirada / token malo → regresar al login
      if (respuesta.status === 401 || respuesta.status === 403) {
        setToken(null);
        mostrarLogin();
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Vuelve a iniciar sesión para continuar."
        });
        return;
      }

      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

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

    revisarSuscripcionesNotificaciones();
    
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    Swal.fire({
      icon: "error",
      title: "Error al cargar datos",
      text: "No se pudieron obtener los registros del servidor."
    });
  }
}

async function revisarSuscripcionesNotificaciones() {
  if (!navigator.onLine) return;
  if (!Array.isArray(gastosGlobal) || gastosGlobal.length === 0) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximas3Dias = [];
  const hoyCobro = [];

  // Buscamos gastos de categoría "Suscripciones" con fecha o fechaRenovacion
  gastosGlobal.forEach((g) => {
    if (g.categoria !== "Suscripciones") return;

    const fechaBase = g.fechaRenovacion || g.fecha;
    if (!fechaBase) return;

    const fechaCobro = new Date(fechaBase);
    if (isNaN(fechaCobro.getTime())) return;

    fechaCobro.setHours(0, 0, 0, 0);

    const diffMs = fechaCobro - hoy;
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 3) {
      proximas3Dias.push({
        descripcion: g.descripcion,
        fecha: fechaCobro.toISOString(),
      });
    } else if (diffDias === 0) {
      hoyCobro.push({
        descripcion: g.descripcion,
        fecha: fechaCobro.toISOString(),
      });
    }
  });

  // En 3 días
  if (!alertaSubs3DiasEnviada && proximas3Dias.length > 0) {
    alertaSubs3DiasEnviada = true;
    try {
      await apiFetch("/api/notificaciones/suscripciones-recordatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proximas3Dias }),
      });
    } catch (err) {
      console.error("Error enviando notificación de suscripciones (3 días):", err);
    }
  }

  // Hoy
  if (!alertaSubsHoyEnviada && hoyCobro.length > 0) {
    alertaSubsHoyEnviada = true;
    try {
      await apiFetch("/api/notificaciones/suscripciones-recordatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoyCobro }),
      });
    } catch (err) {
      console.error("Error enviando notificación de suscripciones (hoy):", err);
    }
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

async function inicializarGraficas() {
  try {
    const respuesta = await apiFetch(API_URL);
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

  // 1) SIN INTERNET → Guardar operación pendiente (crear / editar)
  if (!navigator.onLine) {
    console.warn("Sin conexión: guardando operación pendiente en localStorage...");

    if (editando && gastoId) {
      // operación de edición offline
      guardarPendienteLocal({
        accion: "editar",
        id: gastoId,
        gasto: nuevoGasto
      });

      // Actualizar en memoria para que el usuario vea el cambio
      const idx = gastosGlobal.findIndex(g => g._id === gastoId);
      if (idx !== -1) {
        gastosGlobal[idx] = { ...gastosGlobal[idx], ...nuevoGasto };
      }
    } else {
      // operación de creación offline
      guardarPendienteLocal({
        accion: "crear",
        gasto: nuevoGasto
      });

      // Lo añadimos a la lista en memoria (sin _id, pero se corregirá al sincronizar)
      gastosGlobal.push(nuevoGasto);
    }

    window.gastosGlobal = gastosGlobal;
    pintarTabla(gastosGlobal);

    Swal.fire({
      icon: "info",
      title: "Guardado sin internet",
      text: "Se sincronizará automáticamente cuando vuelvas a estar en línea"
    });

    popup.style.display = "none";
    return;
  }

  // 2) CON INTERNET → Intentamos guardar en la API
  try {
    let respuesta;
    if (editando && gastoId) {
      respuesta = await apiFetch(`${API_URL}/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto)
      });
    } else {
      respuesta = await apiFetch(API_URL, {
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
    mostrarGastos();

  } catch (error) {
    console.warn("Falló el guardado online, se guardará como operación pendiente:", error);

    if (editando && gastoId) {
      guardarPendienteLocal({
        accion: "editar",
        id: gastoId,
        gasto: nuevoGasto
      });

      const idx = gastosGlobal.findIndex(g => g._id === gastoId);
      if (idx !== -1) {
        gastosGlobal[idx] = { ...gastosGlobal[idx], ...nuevoGasto };
      }
    } else {
      guardarPendienteLocal({
        accion: "crear",
        gasto: nuevoGasto
      });

      gastosGlobal.push(nuevoGasto);
    }

    window.gastosGlobal = gastosGlobal;
    pintarTabla(gastosGlobal);

    Swal.fire({
      icon: "info",
      title: "Guardado sin internet",
      text: "Se sincronizará automáticamente cuando vuelvas a estar en línea"
    });

    popup.style.display = "none";
  }
};

window.editarGasto = async (id) => {
  try {
    const res = await apiFetch(API_URL);
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

  // SIN INTERNET → marcar eliminación pendiente y actualizar tabla local
  if (!navigator.onLine) {
    guardarPendienteLocal({
      accion: "eliminar",
      id
    });

    // quitar de la lista en memoria
    gastosGlobal = gastosGlobal.filter(g => g._id === id ? false : true);
    window.gastosGlobal = gastosGlobal;
    pintarTabla(gastosGlobal);

    Swal.fire({
      icon: "info",
      title: "Eliminado sin internet",
      text: "Se sincronizará automáticamente cuando vuelvas a estar en línea"
    });

    return;
  }

  // CON INTERNET → eliminar directamente en la API
  try {
    const res = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");

    Swal.fire({
      icon: "success",
      title: "Registro eliminado",
      timer: 1500,
      showConfirmButton: false
    });

    // recargar tabla desde el backend
    mostrarGastos();
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
    const respuesta = await apiFetch(API_PRESUPUESTOS, {
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

    const res = await apiFetch(`${API_PRESUPUESTOS}?mes=${mes}&anio=${año}`);
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
    const excedidos = [];
    const avisosAvance = [];

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

      if (porcentaje >= 100) {
        excedidos.push({
          categoria: esGeneral ? "GENERAL" : p.categoria,
          monto: p.monto,
          gastado: gastado
        });
      }

      if (porcentaje >= 75 && porcentaje < 100) {
          avisosAvance.push({
            categoria: esGeneral ? "GENERAL" : p.categoria,
            porcentaje: 75,
            gastado,
            monto: p.monto
          });
        } else if (porcentaje >= 50 && porcentaje < 75) {
          avisosAvance.push({
            categoria: esGeneral ? "GENERAL" : p.categoria,
            porcentaje: 50,
            gastado,
            monto: p.monto
          });
        }

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

    if (!alertaPresupuestoEnviada && excedidos.length > 0 && navigator.onLine) {
      alertaPresupuestoEnviada = true;

      try {
        await apiFetch("/api/notificaciones/presupuesto-superado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excedidos })
        });
      } catch (err) {
        console.error("Error enviando notificación de presupuesto:", err);
      }
    }

    if (avisosAvance.length > 0 && navigator.onLine) {
      try {
        await apiFetch("/api/notificaciones/presupuesto-avance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avisosAvance })
        });
      } catch (err) {
        console.error("Error enviando notificación de avance de presupuesto:", err);
      }
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

async function sincronizarConServidor() {
  const offline = await obtenerOffline();
  if (!offline.length) return;

  try {
    for (const gasto of offline) {
      await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gasto)
      });
    }

    await limpiarOffline();
    Swal.fire({
      icon: "success",
      title: "Sincronización completada",
      text: "Tus datos offline ya están guardados en la nube"
    });

    mostrarGastos(); // recargar tabla desde API
  } catch (err) {
    console.error("Error al sincronizar:", err);
  }
}


// Detectar reconexión
window.addEventListener("online", sincronizarConServidor);
// Al volver la conexión o al cargar la página, intentamos sincronizar
window.addEventListener("online", sincronizarPendientes);

async function sincronizarPendientes() {
  const pendientes = cargarPendientesLocal();
  if (!pendientes.length || !navigator.onLine) return;

  try {
    for (const op of pendientes) {
      if (op.accion === "crear" && op.gasto) {
        await apiFetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.gasto)
        });
      } else if (op.accion === "editar" && op.id && op.gasto) {
        await apiFetch(`${API_URL}/${op.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.gasto)
        });
      } else if (op.accion === "eliminar" && op.id) {
        await apiFetch(`${API_URL}/${op.id}`, {
          method: "DELETE"
        });
      }
    }

    limpiarPendientesLocal();

    Swal.fire({
      icon: "success",
      title: "Sincronización completada",
      text: "Los cambios realizados sin internet ya fueron sincronizados."
    });

    // Recargar datos desde el backend para quedar consistentes
    mostrarGastos();
  } catch (err) {
    console.error("Error al sincronizar pendientes:", err);
  }
}

// Ejecutar cuando cargue la página
//mostrarGastos();

// --------- LOGIN CON BACKEND ---------
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginContainer = document.getElementById("loginContainer");
const appContainer = document.getElementById("appContainer");

function getToken() {
  return localStorage.getItem("fintrackToken") || null;
}

function setToken(token) {
  if (token) {
    localStorage.setItem("fintrackToken", token);
  } else {
    localStorage.removeItem("fintrackToken");
  }
}

// Helper para añadir Authorization a todos los fetch
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

function mostrarApp() {
  if (loginContainer) loginContainer.style.display = "none";
  if (appContainer) appContainer.style.display = "block";

  // aquí se dispara la carga de datos de la app
  mostrarGastos();
}

function mostrarLogin() {
  if (loginContainer) loginContainer.style.display = "flex";
  if (appContainer) appContainer.style.display = "none";
}

function comprobarSesion() {
  const token = getToken();
  if (token) {
    mostrarApp();
  } else {
    mostrarLogin();
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    try {
      const res = await fetch(API_AUTH_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al iniciar sesión");
      }

      const data = await res.json();
      setToken(data.token);
      Swal.fire({
        icon: "success",
        title: "Sesión iniciada",
        timer: 1500,
        showConfirmButton: false
      });

      mostrarApp();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: err.message || "Verifica tus credenciales"
      });
    }
  });
}

// Si quieres un botón de cerrar sesión en la UI:
// <button id="btnLogout">Cerrar sesión</button>
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    setToken(null);
    mostrarLogin();
  });
}

// Al cargar la página: primero revisar sesión, luego intentar sincronizar offline
window.addEventListener("load", () => {
  comprobarSesion();       // Si hay token, muestra la app y llama a mostrarGastos()
  sincronizarPendientes(); // Si había registros sin internet, intenta mandarlos
});