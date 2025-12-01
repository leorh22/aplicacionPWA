// db.js — manejo de IndexedDB

const DB_NAME = "fintrack-db";
const DB_VERSION = 1;
const STORE_GASTOS = "gastosOffline";

// Abrir o crear base de datos
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_GASTOS)) {
        db.createObjectStore(STORE_GASTOS, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Guardar gasto offline
export async function guardarOffline(gasto) {
  const db = await abrirDB();
  const tx = db.transaction(STORE_GASTOS, "readwrite");
  tx.objectStore(STORE_GASTOS).add(gasto);
  return tx.complete;
}

// Obtener todos los gastos guardados offline
export async function obtenerOffline() {
  const db = await abrirDB();
  const tx = db.transaction(STORE_GASTOS, "readonly");
  const store = tx.objectStore(STORE_GASTOS);
  return store.getAll();
}

// Vaciar gastos offline ya sincronizados
export async function limpiarOffline() {
  const db = await abrirDB();
  const tx = db.transaction(STORE_GASTOS, "readwrite");
  tx.objectStore(STORE_GASTOS).clear();
  return tx.complete;
}
