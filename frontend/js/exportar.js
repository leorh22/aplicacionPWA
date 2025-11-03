export function exportarCSV(datos) {
  if (!datos || datos.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // Encabezados
  const encabezados = Object.keys(datos[0]);

  // Filas CSV
  const filas = datos.map(obj =>
    encabezados.map(campo => JSON.stringify(obj[campo] ?? "")).join(",")
  );

  const csv = [encabezados.join(","), ...filas].join("\n");

  // Descargar archivo
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gastos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function exportarJSON(datos) {
  if (!datos || datos.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gastos.json";
  link.click();
  URL.revokeObjectURL(url);
}