// graficas.js
let graficaBarras, graficaLinea;

// === GRÁFICO DE PASTEL ===
// Muestra la distribución del gasto por categoría
let graficaPie = null;

export function graficoPastel(datos) {
  const ctx = document.getElementById("graficaPie").getContext("2d");

  const selectAnio = document.getElementById("anioGastos");
  const selectMes = document.getElementById("mesGastos");

  // Generar años únicos
  const anios = [...new Set(datos.map(d => new Date(d.fecha).getFullYear()))].sort((a, b) => b - a);
  const meses = [
    "Todos", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Poblar selects solo una vez
  if (selectAnio.options.length === 0) {
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
  }

  if (selectMes.options.length === 0) {
    meses.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i === 0 ? "Todos" : i - 1; // enero=0, etc.
      opt.textContent = m;
      selectMes.appendChild(opt);
    });
  }

  // Función para filtrar y graficar
  function actualizarGrafico() {
    const anioSel = selectAnio.value;
    const mesSel = selectMes.value;

    const filtrados = datos.filter(d => {
      const f = new Date(d.fecha);
      const cumpleTipo = d.tipo === "Gasto";
      const cumpleAnio = anioSel === "Todos" || f.getFullYear() === parseInt(anioSel);
      const cumpleMes = mesSel === "Todos" || f.getMonth() === parseInt(mesSel);
      return cumpleTipo && cumpleAnio && cumpleMes;
    });

    const categorias = [...new Set(filtrados.map(d => d.categoria))];
    const montos = categorias.map(cat =>
      filtrados.filter(d => d.categoria === cat).reduce((sum, i) => sum + i.monto, 0)
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
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: `Gastos por categoría ${
              anioSel === "Todos" ? "" : `(${anioSel}${mesSel !== "Todos" ? ` - ${meses[parseInt(mesSel) + 1]}` : ""})`
            }`
          }
        }
      }
    });
  }

  // Eventos
  selectAnio.addEventListener("change", actualizarGrafico);
  selectMes.addEventListener("change", actualizarGrafico);

  actualizarGrafico();
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

export function graficoIngresos(datos) {
  const ctx = document.getElementById("graficaIngresos").getContext("2d");

  const selectAnio = document.getElementById("anioIngresos");
  const selectMes = document.getElementById("mesIngresos");

  const anios = [...new Set(datos.map(d => new Date(d.fecha).getFullYear()))].sort((a, b) => b - a);
  const meses = [
    "Todos", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  if (selectAnio.options.length === 0) {
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
  }

  if (selectMes.options.length === 0) {
    meses.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i === 0 ? "Todos" : i - 1;
      opt.textContent = m;
      selectMes.appendChild(opt);
    });
  }

  function actualizarGrafico() {
    const anioSel = selectAnio.value;
    const mesSel = selectMes.value;

    const filtrados = datos.filter(d => {
      const f = new Date(d.fecha);
      const cumpleTipo = d.tipo === "Ingreso";
      const cumpleAnio = anioSel === "Todos" || f.getFullYear() === parseInt(anioSel);
      const cumpleMes = mesSel === "Todos" || f.getMonth() === parseInt(mesSel);
      return cumpleTipo && cumpleAnio && cumpleMes;
    });

    const categorias = [...new Set(filtrados.map(d => d.categoria))];
    const montos = categorias.map(cat =>
      filtrados.filter(d => d.categoria === cat).reduce((sum, i) => sum + i.monto, 0)
    );

    if (graficaIngresos) graficaIngresos.destroy();

    graficaIngresos = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: categorias,
        datasets: [{
          label: "Ingresos",
          data: montos,
          backgroundColor: [
            "#36A2EB", "#4BC0C0", "#9966FF",
            "#FFCE56", "#2ECC71", "#F39C12", "#E74C3C"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: `Ingresos por categoría ${
              anioSel === "Todos" ? "" : `(${anioSel}${mesSel !== "Todos" ? ` - ${meses[parseInt(mesSel) + 1]}` : ""})`
            }`
          }
        },
        cutout: "60%"
      }
    });
  }

  selectAnio.addEventListener("change", actualizarGrafico);
  selectMes.addEventListener("change", actualizarGrafico);

  actualizarGrafico();
}

let graficaRadar = null;

// === GRÁFICO RADAR COMPARATIVO MULTIANUAL ===
export function graficoRadar(datos) {
  const canvas = document.getElementById("graficaRadar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const tipoSelect = document.getElementById("tipoRadar");
  const mes1Select = document.getElementById("mesRadar1");
  const mes2Select = document.getElementById("mesRadar2");
  const anio1Select = document.getElementById("anioRadar1");
  const anio2Select = document.getElementById("anioRadar2");

  const nombresMeses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  // --- Poblar selects ---
  mes1Select.innerHTML = "";
  mes2Select.innerHTML = "";
  nombresMeses.forEach((m, i) => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = opt2.value = i;
    opt1.textContent = opt2.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    mes1Select.appendChild(opt1);
    mes2Select.appendChild(opt2);
  });

  const aniosUnicos = [...new Set(datos.map(d => new Date(d.fecha).getFullYear()))].sort((a, b) => b - a);
  anio1Select.innerHTML = "";
  anio2Select.innerHTML = "";
  aniosUnicos.forEach(a => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = opt2.value = a;
    opt1.textContent = opt2.textContent = a;
    anio1Select.appendChild(opt1);
    anio2Select.appendChild(opt2);
  });

  // Selección inicial
  mes1Select.selectedIndex = 0;
  mes2Select.selectedIndex = 1;
  anio1Select.selectedIndex = 0;
  anio2Select.selectedIndex = 0;

  // --- Dibujar Radar ---
  function actualizarRadar() {
    const tipo = tipoSelect.value;
    const mes1 = parseInt(mes1Select.value);
    const mes2 = parseInt(mes2Select.value);
    const anio1 = parseInt(anio1Select.value);
    const anio2 = parseInt(anio2Select.value);

    const categorias =
      tipo === "Gasto"
        ? ["Comida", "Transporte", "Entretenimiento", "Suscripciones", "Salud", "Educación", "Ropa", "Hogar", "Otros"]
        : ["Salario", "Freelance", "Inversiones", "Regalos", "Otros"];

    const datosMes1 = categorias.map(cat =>
      datos
        .filter(d => {
          const f = new Date(d.fecha);
          return (
            d.tipo === tipo &&
            f.getFullYear() === anio1 &&
            f.getMonth() === mes1 &&
            d.categoria === cat
          );
        })
        .reduce((sum, item) => sum + item.monto, 0)
    );

    const datosMes2 = categorias.map(cat =>
      datos
        .filter(d => {
          const f = new Date(d.fecha);
          return (
            d.tipo === tipo &&
            f.getFullYear() === anio2 &&
            f.getMonth() === mes2 &&
            d.categoria === cat
          );
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
            label: `${nombresMeses[mes1]} ${anio1}`,
            data: datosMes1,
            backgroundColor: "rgba(54, 162, 235, 0.3)",
            borderColor: "#36A2EB",
            borderWidth: 2,
            pointBackgroundColor: "#36A2EB"
          },
          {
            label: `${nombresMeses[mes2]} ${anio2}`,
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
            text: `Comparativa de ${tipo.toLowerCase()}s (${nombresMeses[mes1]} ${anio1} vs ${nombresMeses[mes2]} ${anio2})`
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: $${ctx.raw.toLocaleString("es-MX")}`
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
                if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
                return value;
              },
              backdropColor: "transparent",
              color: "#666"
            },
            pointLabels: {
              font: { size: 13, weight: "bold" },
              color: "#222"
            }
          }
        }
      }
    });
  }

  // --- Eventos ---
  [tipoSelect, mes1Select, mes2Select, anio1Select, anio2Select].forEach(select =>
    select.addEventListener("change", actualizarRadar)
  );

  actualizarRadar();
}

