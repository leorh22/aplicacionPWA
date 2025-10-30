// js/app.js  (solo online)
const API_URL = "/api/gastos";

const tabla = document.querySelector("#tablaGastos tbody");
const popup = document.getElementById("popup");
const form = document.getElementById("formGasto");
const btnAgregar = document.getElementById("btnAgregar");
const cancelar = document.getElementById("cancelar");
const tituloPopup = document.getElementById("tituloPopup");

let editando = false;
let gastoId = null;

// Nota: sin service worker por ahora para evitar caché viejo

// === CARGAR GASTOS ===
let gastosGlobal = [];

// Función para cargar los datos desde el backend
async function cargarGastos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const datos = await res.json();
    mostrarGastos(datos);
  } catch (error) {
    console.error("Error al cargar gastos:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los registros desde el servidor."
    });
  }
}

// Función que imprime los datos en la tabla
function mostrarGastos(datos) {
  tabla.innerHTML = ""; // limpia la tabla

  if (datos.length === 0) {
    const fila = document.createElement("tr");
    fila.innerHTML = `<td colspan="6" style="text-align:center;">No hay registros</td>`;
    tabla.appendChild(fila);
    return;
  }

  datos.forEach(gasto => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${gasto.tipo}</td>
      <td>${gasto.categoria}</td>
      <td>${gasto.descripcion}</td>
      <td>${gasto.monto}</td>
      <td>${new Date(gasto.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
      <td>
        <button onclick="editarGasto('${gasto._id}')">Editar</button>
        <button onclick="eliminarGasto('${gasto._id}')">Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

// === FORMULARIO ===
btnAgregar.onclick = () => {
  form.reset();
  editando = false;
  tituloPopup.textContent = "Agregar registro";
  popup.style.display = "flex";
};

cancelar.onclick = () => popup.style.display = "none";

form.onsubmit = async (e) => {
  e.preventDefault();

  const registro = {
    tipo: document.getElementById("tipo").value,
    categoria: document.getElementById("categoria").value,
    descripcion: document.getElementById("descripcion").value,
    monto: parseFloat(document.getElementById("monto").value),
    fecha: document.getElementById("fecha").value
  };

  try {
    if (editando) {
      const res = await fetch(`${API_URL}/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Swal.fire("Actualizado", "El registro fue actualizado correctamente", "success");
    } else {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Swal.fire("Guardado", "Registro agregado correctamente", "success");
    }

    popup.style.display = "none";
    cargarGastos();

  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el registro."
    });
  }
};

// === EDITAR ===
window.editarGasto = async (id) => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const datos = await res.json();
    const gasto = datos.find(g => g._id === id);
    if (!gasto) return;

    gastoId = gasto._id;
    document.getElementById("tipo").value = gasto.tipo;
    document.getElementById("categoria").value = gasto.categoria;
    document.getElementById("descripcion").value = gasto.descripcion;
    document.getElementById("monto").value = gasto.monto;
    document.getElementById("fecha").value = gasto.fecha ? gasto.fecha.split("T")[0] : "";

    tituloPopup.textContent = "Editar registro";
    editando = true;
    popup.style.display = "flex";
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo obtener la información del registro", "error");
  }
};

// === ELIMINAR ===
window.eliminarGasto = async (id) => {
  const resConfirm = await Swal.fire({
    title: "¿Eliminar este registro?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!resConfirm.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    Swal.fire("Eliminado", "Registro eliminado correctamente", "success");
    cargarGastos();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo eliminar el registro", "error");
  }
};

// === CATEGORÍAS ===
const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");

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

// === GRÁFICAS ===
let graficaPie, graficaBarras, graficaLinea;

function actualizarGraficas(datos) {
  const gastos = datos.filter(d => d.tipo === "Gasto");
  const ingresos = datos.filter(d => d.tipo === "Ingreso");

  const categoriasUnicas = [...new Set(gastos.map(g => g.categoria))];
  const montos = categoriasUnicas.map(cat =>
    gastos.filter(g => g.categoria === cat).reduce((a, b) => a + b.monto, 0)
  );

  const ctxPie = document.getElementById("graficaPie").getContext("2d");
  if (graficaPie) graficaPie.destroy();
  graficaPie = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: categoriasUnicas,
      datasets: [{
        label: "Gastos por categoría",
        data: montos,
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  const meses = [...new Set(datos.map(d =>
    new Date(d.fecha).toLocaleString("default", { month: "short" })
  ))];
  const totalGastos = meses.map(m =>
    gastos.filter(d =>
      new Date(d.fecha).toLocaleString("default", { month: "short" }) === m
    ).reduce((a, b) => a + b.monto, 0)
  );
  const totalIngresos = meses.map(m =>
    ingresos.filter(d =>
      new Date(d.fecha).toLocaleString("default", { month: "short" }) === m
    ).reduce((a, b) => a + b.monto, 0)
  );

  const ctxBar = document.getElementById("graficaBarras").getContext("2d");
  if (graficaBarras) graficaBarras.destroy();
  graficaBarras = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        { label: "Gastos", data: totalGastos, backgroundColor: "#FF6384" },
        { label: "Ingresos", data: totalIngresos, backgroundColor: "#36A2EB" }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  let balance = 0;
  const balances = meses.map((m, i) => {
    balance += totalIngresos[i] - totalGastos[i];
    return balance;
  });

  const ctxLine = document.getElementById("graficaLinea").getContext("2d");
  if (graficaLinea) graficaLinea.destroy();
  graficaLinea = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        label: "Balance acumulado",
        data: balances,
        borderColor: "#4BC0C0",
        fill: false
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

// === FILTROS ===
document.getElementById("filtroTipo").addEventListener("change", aplicarFiltros);
document.getElementById("filtroCategoria").addEventListener("change", aplicarFiltros);
document.getElementById("filtroDesde").addEventListener("change", aplicarFiltros);
document.getElementById("filtroHasta").addEventListener("change", aplicarFiltros);
document.getElementById("filtroBusqueda").addEventListener("input", aplicarFiltros);
document.getElementById("limpiarFiltros").addEventListener("click", () => {
  document.querySelectorAll("#filtros select, #filtros input").forEach(e => e.value = "");
  mostrarGastos(gastosGlobal);
  actualizarGraficas(gastosGlobal);
});

function aplicarFiltros() {
  const tipo = document.getElementById("filtroTipo").value;
  const categoria = document.getElementById("filtroCategoria").value;
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;
  const busqueda = document.getElementById("filtroBusqueda").value.toLowerCase();

  const filtrados = gastosGlobal.filter(g => {
    const fecha = new Date(g.fecha);
    const cumpleTipo = !tipo || g.tipo === tipo;
    const cumpleCategoria = !categoria || g.categoria === categoria;
    const cumpleDesde = !desde || fecha >= new Date(desde);
    const cumpleHasta = !hasta || fecha <= new Date(hasta);
    const cumpleBusqueda = g.descripcion.toLowerCase().includes(busqueda);
    return cumpleTipo && cumpleCategoria && cumpleDesde && cumpleHasta && cumpleBusqueda;
  });

  mostrarGastos(filtrados);
  actualizarGraficas(filtrados);
}

// Inicializar
cargarGastos();
