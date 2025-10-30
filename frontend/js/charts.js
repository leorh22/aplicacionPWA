// charts.js
import Chart from "./chart.umd.js";

// === Pie Chart: Distribución de gastos por categoría ===
export function renderGastoPieChart(data) {
  const ctx = document.getElementById("gastoPieChart");
  if (!ctx) return;

  const categorias = [...new Set(data.map(d => d.categoria))];
  const totales = categorias.map(cat =>
    data.filter(d => d.categoria === cat)
        .reduce((sum, d) => sum + d.monto, 0)
  );

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: categorias,
      datasets: [{
        data: totales,
        backgroundColor: [
          "#4e79a7", "#f28e2b", "#e15759",
          "#76b7b2", "#59a14f", "#edc949"
        ],
        hoverOffset: 8
      }]
    },
    options: { responsive: true, animation: { duration: 800 } }
  });
}

// === Bar Chart: Ingresos vs Gastos por mes ===
export function renderBarChart(data) {
  const ctx = document.getElementById("barChart");
  if (!ctx) return;

  const meses = [...new Set(data.map(d => new Date(d.fecha).toLocaleString("es-MX", { month: "short" })))];
  const ingresos = meses.map(m => data.filter(d => d.tipo === "Ingreso" && new Date(d.fecha).toLocaleString("es-MX", { month: "short" }) === m)
    .reduce((sum, d) => sum + d.monto, 0));
  const gastos = meses.map(m => data.filter(d => d.tipo === "Gasto" && new Date(d.fecha).toLocaleString("es-MX", { month: "short" }) === m)
    .reduce((sum, d) => sum + d.monto, 0));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        { label: "Ingresos", data: ingresos, backgroundColor: "#59a14f" },
        { label: "Gastos", data: gastos, backgroundColor: "#e15759" }
      ]
    },
    options: { responsive: true, animation: { duration: 800 } }
  });
}

// === Line Chart: Evolución del balance ===
export function renderLineChart(data) {
  const ctx = document.getElementById("lineChart");
  if (!ctx) return;

  const fechas = data.map(d => new Date(d.fecha)).sort((a, b) => a - b);
  let balance = 0;
  const puntos = fechas.map(fecha => {
    const delDia = data.filter(d => new Date(d.fecha).toDateString() === fecha.toDateString());
    delDia.forEach(d => {
      balance += d.tipo === "Ingreso" ? d.monto : -d.monto;
    });
    return balance;
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: fechas.map(f => f.toLocaleDateString("es-MX")),
      datasets: [{
        label: "Balance",
        data: puntos,
        borderColor: "#4e79a7",
        fill: false,
        tension: 0.3
      }]
    },
    options: { responsive: true, animation: { duration: 1000 } }
  });
}