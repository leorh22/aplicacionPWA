import { graficoPastel, graficoBarras, graficoLinea } from "./graficas.js";

// Referencias a los elementos
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroDesde = document.getElementById("filtroDesde");
const filtroHasta = document.getElementById("filtroHasta");
const filtroBusqueda = document.getElementById("filtroBusqueda");
const btnLimpiar = document.getElementById("limpiarFiltros");

export function inicializarFiltros(gastos, mostrarGastos) {
  function aplicarFiltros() {
    let filtrados = gastos;

    const tipo = filtroTipo.value;
    const categoria = filtroCategoria.value;
    const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
    const hasta = filtroHasta.value ? new Date(filtroHasta.value) : null;
    const busqueda = filtroBusqueda.value.trim().toLowerCase();

    // Filtrado paso a paso
    filtrados = filtrados.filter(g => {
      const fecha = new Date(g.fecha);
      const cumpleTipo = !tipo || g.tipo === tipo;
      const cumpleCat = !categoria || g.categoria === categoria;
      const cumpleDesde = !desde || fecha >= desde;
      const cumpleHasta = !hasta || fecha <= hasta;
      const cumpleBusqueda = !busqueda || g.descripcion.toLowerCase().includes(busqueda);
      return cumpleTipo && cumpleCat && cumpleDesde && cumpleHasta && cumpleBusqueda;
    });

    // Actualizar tabla y gráficas
    mostrarGastos(filtrados);
    graficoPastel(filtrados);
    graficoBarras(filtrados);
    graficoLinea(filtrados);
  }

  // Eventos de cambio
  filtroTipo.addEventListener("change", aplicarFiltros);
  filtroCategoria.addEventListener("change", aplicarFiltros);
  filtroDesde.addEventListener("change", aplicarFiltros);
  filtroHasta.addEventListener("change", aplicarFiltros);
  filtroBusqueda.addEventListener("input", aplicarFiltros);

  // Botón "Limpiar"
  btnLimpiar.addEventListener("click", () => {
    filtroTipo.value = "";
    filtroCategoria.value = "";
    filtroDesde.value = "";
    filtroHasta.value = "";
    filtroBusqueda.value = "";

    mostrarGastos(gastos);
    graficoPastel(gastos);
    graficoBarras(gastos);
    graficoLinea(gastos);
  });
}