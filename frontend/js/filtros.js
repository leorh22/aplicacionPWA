//import { mostrarGastos, gastosGlobal } from "./app.js"; 

// Obtener referencias a los elementos
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroDesde = document.getElementById("filtroDesde");
const filtroHasta = document.getElementById("filtroHasta");
const filtroBusqueda = document.getElementById("filtroBusqueda");
const btnLimpiar = document.getElementById("limpiarFiltros");

// --- Aplicar filtros ---
export function aplicarFiltros() {
  const tipo = filtroTipo.value;
  const categoria = filtroCategoria.value;
  const desde = filtroDesde.value;
  const hasta = filtroHasta.value;
  const busqueda = filtroBusqueda.value.toLowerCase();

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
}

// --- Limpiar filtros ---
btnLimpiar.addEventListener("click", () => {
  document.querySelectorAll("#filtros select, #filtros input").forEach(e => e.value = "");
  mostrarGastos(gastosGlobal);
});

// --- Eventos ---
[filtroTipo, filtroCategoria, filtroDesde, filtroHasta].forEach(filtro => {
  filtro.addEventListener("change", aplicarFiltros);
});

filtroBusqueda.addEventListener("input", aplicarFiltros);