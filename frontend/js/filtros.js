// filtros.js
// Inicializa filtros que afectan SOLO a la tabla.
// Requiere que le pases los datos completos y una función mostrarGastos(lista).

export function inicializarFiltros(datos, mostrarGastos) {
  const filtroTipo = document.getElementById("filtroTipo");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const filtroDesde = document.getElementById("filtroDesde");
  const filtroHasta = document.getElementById("filtroHasta");
  const filtroBusqueda = document.getElementById("filtroBusqueda");
  const btnLimpiar = document.getElementById("limpiarFiltros");

  // Precalcular categorías por tipo
  const categoriasPorTipo = {
    Gasto: [...new Set(datos.filter(d => d.tipo === "Gasto").map(d => d.categoria))].sort(),
    Ingreso: [...new Set(datos.filter(d => d.tipo === "Ingreso").map(d => d.categoria))].sort(),
  };
  const categoriasUnion = [...new Set([...categoriasPorTipo.Gasto, ...categoriasPorTipo.Ingreso])].sort();

  // Rellena el select de categorías según el tipo seleccionado
  function poblarCategorias(tipoActual) {
    // Reset
    filtroCategoria.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Todas las categorías";
    filtroCategoria.appendChild(optDefault);

    let lista;
    if (tipoActual === "Gasto") lista = categoriasPorTipo.Gasto;
    else if (tipoActual === "Ingreso") lista = categoriasPorTipo.Ingreso;
    else lista = categoriasUnion; // Todos

    lista.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      filtroCategoria.appendChild(opt);
    });
  }

  // Lógica de filtrado (solo tabla)
  function aplicarFiltros() {
    const tipoSel = filtroTipo.value;          // "", "Gasto", "Ingreso"
    const catSel = filtroCategoria.value;      // "", o una categoría válida del combo actual
    const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
    const hasta = filtroHasta.value ? new Date(filtroHasta.value) : null;
    const q = filtroBusqueda.value.toLowerCase().trim();

    const filtrados = datos.filter(d => {
      const fecha = new Date(d.fecha);
      // Tipo
      const okTipo = !tipoSel || d.tipo === tipoSel;

      // Categoría:
      // - Si hay tipo (Gasto/Ingreso), la categoría ya pertenece a ese dominio.
      // - Si no hay tipo (Todos) y hay categoría seleccionada, se filtra por esa categoría sobre ambos tipos.
      const okCategoria = !catSel || d.categoria === catSel;

      // Fechas
      const okDesde = !desde || fecha >= desde;
      const okHasta = !hasta || fecha <= hasta;

      // Búsqueda por descripción
      const okTexto = d.descripcion.toLowerCase().includes(q);

      return okTipo && okCategoria && okDesde && okHasta && okTexto;
    });

    mostrarGastos(filtrados);
  }

  // Eventos
  filtroTipo.addEventListener("change", () => {
    // Al cambiar el tipo, repoblar categorías según el tipo elegido
    const tipo = filtroTipo.value; // "", "Gasto", "Ingreso"
    const categoriaAnterior = filtroCategoria.value;
    poblarCategorias(tipo);

    // Si la categoría previamente seleccionada no existe en la nueva lista, se limpia
    const existe = [...filtroCategoria.options].some(o => o.value === categoriaAnterior);
    filtroCategoria.value = existe ? categoriaAnterior : "";

    aplicarFiltros();
  });

  [filtroCategoria, filtroDesde, filtroHasta].forEach(el =>
    el.addEventListener("change", aplicarFiltros)
  );
  filtroBusqueda.addEventListener("input", aplicarFiltros);

  btnLimpiar.addEventListener("click", () => {
    filtroTipo.value = "";
    poblarCategorias(""); // union
    filtroCategoria.value = "";
    filtroDesde.value = "";
    filtroHasta.value = "";
    filtroBusqueda.value = "";
    mostrarGastos(datos);
  });

  // Inicialización
  poblarCategorias(""); // por defecto: Todos -> unión de categorías
  mostrarGastos(datos); // pinta tabla completa de inicio
}
