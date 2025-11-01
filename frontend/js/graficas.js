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
        label: "Gastos",
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

  // Obtener todos los meses (0–11) presentes en los datos
  const mesesNum = [...new Set(datos.map(d => new Date(d.fecha).getMonth()))].sort((a, b) => a - b);

  // Convertir a nombres cortos ordenados
  const meses = mesesNum.map(m => new Date(2024, m, 1).toLocaleString("es-ES", { month: "short" }));

  const totalGastos = mesesNum.map(m =>
    datos.filter(d => d.tipo === "Gasto" && new Date(d.fecha).getMonth() === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  const totalIngresos = mesesNum.map(m =>
    datos.filter(d => d.tipo === "Ingreso" && new Date(d.fecha).getMonth() === m)
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
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { beginAtZero: true },
      }
    }
  });
}

// === GRÁFICO DE LÍNEA ===
// Muestra la evolución del balance en el tiempo
export function graficoLinea(datos) {
  const ctx = document.getElementById("graficaLinea").getContext("2d");

  // Ordenar meses numéricamente (enero a diciembre)
  const mesesNum = [...new Set(datos.map(d => new Date(d.fecha).getMonth()))].sort((a, b) => a - b);
  const meses = mesesNum.map(m => new Date(2024, m, 1).toLocaleString("es-ES", { month: "short" }));

  const totalGastos = mesesNum.map(m =>
    datos.filter(d => d.tipo === "Gasto" && new Date(d.fecha).getMonth() === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  const totalIngresos = mesesNum.map(m =>
    datos.filter(d => d.tipo === "Ingreso" && new Date(d.fecha).getMonth() === m)
         .reduce((sum, item) => sum + item.monto, 0)
  );

  // Calcular el balance acumulado
  let balance = 0;
  const balances = mesesNum.map((_, i) => {
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
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Evolución del balance" }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

let graficaIngresos = null;

// === GRÁFICO DE INGRESOS POR CATEGORÍA (DONA) ===
export function graficoIngresos(datos) {
  const canvas = document.getElementById("graficaIngresos");
  if (!canvas) {
    console.warn("No se encontró el elemento #graficaIngresos en el DOM");
    return;
  }

  const ctx = canvas.getContext("2d");

  // Filtrar solo ingresos
  const ingresos = datos.filter(d => d.tipo === "Ingreso");

  if (ingresos.length === 0) {
    if (graficaIngresos) graficaIngresos.destroy();
    return;
  }

  // Categorías únicas
  const categorias = [...new Set(ingresos.map(d => d.categoria))];

  // Total por categoría
  const totales = categorias.map(cat =>
    ingresos
      .filter(i => i.categoria === cat)
      .reduce((sum, item) => sum + item.monto, 0)
  );

  if (graficaIngresos) graficaIngresos.destroy();

  graficaIngresos = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categorias,
      datasets: [{
        label: "Ingresos",
        data: totales,
        backgroundColor: [
          "#36A2EB", "#4BC0C0", "#9966FF", "#FFCE56",
          "#2ECC71", "#F39C12", "#E74C3C"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        },
        title: {
          display: true,
        }
      },
      cutout: "60%", // controla el grosor del anillo
    }
  });
}

let graficaRadar = null;

// === GRÁFICO RADAR COMPARATIVO (POR MES Y AÑO) ===
export function graficoRadar(datos) {
  const canvas = document.getElementById("graficaRadar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const tipoSelect = document.getElementById("tipoRadar");
  const mes1Select = document.getElementById("mesRadar1");
  const mes2Select = document.getElementById("mesRadar2");

  // --- Crear lista única año-mes ---
  const clavesMes = [...new Set(
    datos.map(d => {
      const f = new Date(d.fecha);
      return `${f.getFullYear()}-${String(f.getMonth()).padStart(2, "0")}`;
    })
  )].sort();

  // --- Generar etiquetas legibles ---
  const nombresMeses = clavesMes.map(c => {
    const [year, mes] = c.split("-");
    return `${new Date(year, mes).toLocaleString("es-ES", { month: "long" })} ${year}`;
  });

  // --- Poblar selects ---
  mes1Select.innerHTML = "";
  mes2Select.innerHTML = "";
  clavesMes.forEach((clave, i) => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = opt2.value = clave;
    opt1.textContent = opt2.textContent = nombresMeses[i];
    mes1Select.appendChild(opt1);
    mes2Select.appendChild(opt2);
  });

  // Selección inicial
  mes1Select.selectedIndex = 0;
  mes2Select.selectedIndex = Math.min(1, clavesMes.length - 1);

  function actualizarRadar() {
    const tipo = tipoSelect.value;
    const mes1 = mes1Select.value;
    const mes2 = mes2Select.value;

    const categorias =
      tipo === "Gasto"
        ? ["Comida", "Transporte", "Entretenimiento", "Suscripciones", "Salud", "Educación", "Ropa", "Hogar", "Otros"]
        : ["Salario", "Freelance", "Inversiones", "Regalos", "Otros"];

    const datosMes1 = categorias.map(cat =>
      datos
        .filter(d => {
          const f = new Date(d.fecha);
          const clave = `${f.getFullYear()}-${String(f.getMonth()).padStart(2, "0")}`;
          return d.tipo === tipo && clave === mes1 && d.categoria === cat;
        })
        .reduce((sum, item) => sum + item.monto, 0)
    );

    const datosMes2 = categorias.map(cat =>
      datos
        .filter(d => {
          const f = new Date(d.fecha);
          const clave = `${f.getFullYear()}-${String(f.getMonth()).padStart(2, "0")}`;
          return d.tipo === tipo && clave === mes2 && d.categoria === cat;
        })
        .reduce((sum, item) => sum + item.monto, 0)
    );

    if (graficaRadar) graficaRadar.destroy();

    graficaRadar = new Chart(ctx, {
      type: "radar",
      data: {
        labels: categorias,
        datasets: [
          {
            label: nombresMeses[clavesMes.indexOf(mes1)],
            data: datosMes1,
            backgroundColor: "rgba(54, 162, 235, 0.3)",
            borderColor: "#36A2EB",
            borderWidth: 2,
            pointBackgroundColor: "#36A2EB"
          },
          {
            label: nombresMeses[clavesMes.indexOf(mes2)],
            data: datosMes2,
            backgroundColor: "rgba(255, 99, 132, 0.3)",
            borderColor: "#FF6384",
            borderWidth: 2,
            pointBackgroundColor: "#FF6384"
          }
        ]
      },
      options: {
        responsive: true,
        elements: { line: { tension: 0.3 } },
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: `Comparativa de ${tipo.toLowerCase()}s por categoría`
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 50 },
            pointLabels: { font: { size: 12 } }
          }
        }
      }
    });
  }

  // --- Eventos ---
  tipoSelect.addEventListener("change", actualizarRadar);
  mes1Select.addEventListener("change", actualizarRadar);
  mes2Select.addEventListener("change", actualizarRadar);

  actualizarRadar(); // primera carga
}

