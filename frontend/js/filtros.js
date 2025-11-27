// frontend/js/filtros.js

export function inicializarFiltros() {
  const filtroTipo = document.getElementById("filtroTipo");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const filtroDesde = document.getElementById("filtroDesde");
  const filtroHasta = document.getElementById("filtroHasta");
  const filtroBusqueda = document.getElementById("filtroBusqueda");
  const btnLimpiar = document.getElementById("limpiarFiltros");

  if (!filtroTipo || !filtroCategoria || !filtroDesde || !filtroHasta || !filtroBusqueda) {
    console.warn("No se encontraron todos los elementos de filtro en el DOM");
    return;
  }

  // Llenar combo de categorías a partir de los datos
  function poblarCategorias() {
    const datos = window.gastosGlobal || [];
    const categoriasUnicas = [...new Set(datos.map(g => g.categoria))].sort();

    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    categoriasUnicas.forEach(cat => {
      const op = document.createElement("option");
      op.value = cat;
      op.textContent = cat;
      filtroCategoria.appendChild(op);
    });
  }

  function aplicarFiltros() {
    const datos = window.gastosGlobal || [];
    let filtrados = datos.slice();

    const tipo = filtroTipo.value;
    const categoria = filtroCategoria.value;
    const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
    const hasta = filtroHasta.value ? new Date(filtroHasta.value) : null;
    const texto = filtroBusqueda.value.trim().toLowerCase();

    filtrados = filtrados.filter(g => {
      if (tipo && g.tipo !== tipo) return false;
      if (categoria && g.categoria !== categoria) return false;

      const fechaG = new Date(g.fecha);

      if (desde) {
        const d = new Date(desde);
        d.setHours(0, 0, 0, 0);
        if (fechaG < d) return false;
      }

      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59, 999);
        if (fechaG > h) return false;
      }

      if (texto && !g.descripcion.toLowerCase().includes(texto)) return false;

      return true;
    });

    // 👉 Solo actualizamos la tabla
    if (window.pintarTabla) {
      window.pintarTabla(filtrados);
    } else {
      console.error("window.pintarTabla no está definido");
    }
  }

  // Eventos
  filtroTipo.addEventListener("change", aplicarFiltros);
  filtroCategoria.addEventListener("change", aplicarFiltros);
  filtroDesde.addEventListener("change", aplicarFiltros);
  filtroHasta.addEventListener("change", aplicarFiltros);
  filtroBusqueda.addEventListener("input", aplicarFiltros);

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      filtroTipo.value = "";
      filtroCategoria.value = "";
      filtroDesde.value = "";
      filtroHasta.value = "";
      filtroBusqueda.value = "";
      aplicarFiltros();
    });
  }

  // Llenar categorías al inicio
  poblarCategorias();
}
