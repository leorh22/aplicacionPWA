import { graficoPastel, graficoBarras, graficoLinea } from "./graficas.js";
import { inicializarFiltros } from "./filtros.js";

const API_URL = "http://localhost:3000/api/gastos";

const form = document.getElementById("formGasto");
const popup = document.getElementById("popup");
const tituloPopup = document.getElementById("tituloPopup");
const btnAgregar = document.getElementById("btnAgregar");
const cancelar = document.getElementById("cancelar");

// Elemento <tbody> de la tabla
const tabla = document.querySelector("#tablaGastos tbody");

let editando = false;
let gastoId = null;
let gastosGlobal = [];

// Función principal: obtiene y muestra los registros
async function mostrarGastos() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    const gastos = await respuesta.json();

    // Limpiar tabla
    tabla.innerHTML = "";

    if (gastos.length === 0) {
      const filaVacia = document.createElement("tr");
      filaVacia.innerHTML = `<td colspan="6" style="text-align:center;">No hay registros</td>`;
      tabla.appendChild(filaVacia);
      return;
    }

    // Llenar tabla con los datos
    gastos.forEach(gasto => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${gasto.tipo}</td>
        <td>${gasto.categoria}</td>
        <td>${gasto.descripcion}</td>
        <td>$${gasto.monto.toFixed(2)}</td>
        <td>${new Date(gasto.fecha).toLocaleDateString("es-MX")}</td>
        <td>
          <button onclick="editarGasto('${gasto._id}')">Editar</button>
          <button onclick="eliminarGasto('${gasto._id}')">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });

    if (gastos.length > 0) {
      graficoPastel(gastos);
      graficoBarras(gastos);
      graficoLinea(gastos);
    }

  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    Swal.fire({
      icon: "error",
      title: "Error al cargar datos",
      text: "No se pudieron obtener los registros del servidor."
    });
  }
} 

async function mostrarGastosDesdeServidor() {
  const res = await fetch("/api/gastos");
  const datos = await res.json();
  gastosGlobal = datos;
  mostrarGastos(gastosGlobal);

  graficoPastel(gastosGlobal);  
  graficoBarras(gastosGlobal);
  graficoLinea(gastosGlobal);

  // Inicializar los filtros (solo una vez)
  inicializarFiltros(gastosGlobal, mostrarGastos);
}

mostrarGastosDesdeServidor();

// ==== SELECTS ====
const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");

// Categorías dinámicas según el tipo
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

// Cambia las categorías al seleccionar tipo
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

btnAgregar.onclick = () => {
  form.reset();
  editando = false;
  gastoId = null;
  tituloPopup.textContent = "Agregar registro";
  popup.style.display = "flex";
};

cancelar.onclick = () => {
  popup.style.display = "none";
};

form.onsubmit = async (e) => {
  e.preventDefault();

  const nuevoGasto = {
    tipo: tipoSelect.value,
    categoria: categoriaSelect.value,
    descripcion: document.getElementById("descripcion").value,
    monto: parseFloat(document.getElementById("monto").value),
    fecha: document.getElementById("fecha").value
  };

  try {
    let respuesta;
    if (editando) {
      // PATCH para editar
      respuesta = await fetch(`${API_URL}/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto)
      });
    } else {
      // POST para agregar
      respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto)
      });
    }

    if (!respuesta.ok) throw new Error("Error al guardar");

    Swal.fire({
      icon: "success",
      title: editando ? "Registro actualizado" : "Registro agregado",
      timer: 1500,
      showConfirmButton: false
    });

    popup.style.display = "none";
    mostrarGastos(); // recargar tabla

  } catch (error) {
    console.error("Error al guardar registro:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el registro."
    });
  }
};

window.editarGasto = async (id) => {
  try {
    const res = await fetch(API_URL);
    const datos = await res.json();
    const gasto = datos.find(g => g._id === id);
    if (!gasto) return;

    // Llenar el formulario con los datos existentes
    gastoId = gasto._id;
    tipoSelect.value = gasto.tipo;

    // Actualizar opciones de categoría según tipo
    categoriaSelect.innerHTML = '<option value="">Selecciona categoría</option>';
    categorias[gasto.tipo].forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });

    categoriaSelect.value = gasto.categoria;
    document.getElementById("descripcion").value = gasto.descripcion;
    document.getElementById("monto").value = gasto.monto;
    document.getElementById("fecha").value = gasto.fecha ? gasto.fecha.split("T")[0] : "";

    tituloPopup.textContent = "Editar registro";
    editando = true;
    popup.style.display = "flex";
  } catch (error) {
    console.error("Error al editar registro:", error);
    Swal.fire("Error", "No se pudo obtener el registro", "error");
  }
};

window.eliminarGasto = async (id) => {
  const confirmacion = await Swal.fire({
    title: "¿Eliminar este registro?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");

    Swal.fire({
      icon: "success",
      title: "Registro eliminado",
      timer: 1500,
      showConfirmButton: false
    });

    mostrarGastos(); // refrescar tabla
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar el registro."
    });
  }
};

// Ejecutar cuando cargue la página
mostrarGastos();
