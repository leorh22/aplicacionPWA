// graficas.js
let graficaPie, graficaBarras, graficaLinea;

// === GRÁFICO DE PASTEL ===
// Muestra la distribución del gasto por categoría
export function graficoPastel(gastos) {
  const ctx = document.getElementById("graficaPie").getContext("2d");

  // Filtramos solo los gastos
  const soloGastos = gastos.filter(g => g.tipo === "Gasto");

  const categorias = [...new Set(soloGastos.map(g => g.categoria))];
  const montos = categorias.map(cat =>
    soloGastos.filter(g => g.categoria === cat).reduce((sum, item) => sum + item.monto, 0)
  );

  if (graficaPie) graficaPie.destroy();

  graficaPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categorias,
      datasets: [{
        label: "Gastos por categoría",
        data: montos,
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56",
          "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// === GRÁFICO DE BARRAS ===
// Compara ingresos vs gastos por mes
export function graficoBarras(datos) {
  const ctx = document.getElementById("graficaBarras").getContext("2d");

  const meses = [...new Set(datos.map(d =>
    new Date(d.fecha).toLocaleString("default", { month: "short" })
  ))];

  const totalGastos = meses.map(m =>
    datos.filter(d => d.tipo === "Gasto" && new Date(d.fecha).toLocaleString("default", { month: "short" }) === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  const totalIngresos = meses.map(m =>
    datos.filter(d => d.tipo === "Ingreso" && new Date(d.fecha).toLocaleString("default", { month: "short" }) === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  if (graficaBarras) graficaBarras.destroy();

  graficaBarras = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        { label: "Gastos", data: totalGastos, backgroundColor: "#FF6384" },
        { label: "Ingresos", data: totalIngresos, backgroundColor: "#36A2EB" }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// === GRÁFICO DE LÍNEA ===
// Muestra la evolución del balance en el tiempo
export function graficoLinea(datos) {
  const ctx = document.getElementById("graficaLinea").getContext("2d");

  const meses = [...new Set(datos.map(d =>
    new Date(d.fecha).toLocaleString("default", { month: "short" })
  ))];

  const totalGastos = meses.map(m =>
    datos.filter(d => d.tipo === "Gasto" && new Date(d.fecha).toLocaleString("default", { month: "short" }) === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  const totalIngresos = meses.map(m =>
    datos.filter(d => d.tipo === "Ingreso" && new Date(d.fecha).toLocaleString("default", { month: "short" }) === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  // Calcular el balance acumulado
  let balance = 0;
  const balances = meses.map((_, i) => {
    balance += totalIngresos[i] - totalGastos[i];
    return balance;
  });

  if (graficaLinea) graficaLinea.destroy();

  graficaLinea = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        label: "Balance acumulado",
        data: balances,
        borderColor: "#4BC0C0",
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
}