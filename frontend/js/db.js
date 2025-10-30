const DB_NAME = "GastosDB";
const STORE_NAME = "registros";

// Abrir la base de datos IndexedDB
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "_id", autoIncrement: true });
        store.createIndex("tipo", "tipo", { unique: false });
        store.createIndex("categoria", "categoria", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Agregar o actualizar registro offline
export async function agregarRegistroOffline(registro) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Si ya existe _id, se reemplaza
    store.put(registro);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Marcar registro para eliminar
export async function eliminarRegistroOffline(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Obtener todos los registros offline
export async function obtenerRegistrosOffline() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Sincronizar con servidor
export async function sincronizarConServidor() {
  if (!navigator.onLine) return;

  const registros = await obtenerRegistrosOffline();

  for (const reg of registros) {
    try {
      if (reg.eliminar) {
        await fetch(`http://localhost:3000/api/gastos/${reg._id}`, { method: "DELETE" });
      } else if (reg.editando) {
        const { _id, editando, ...data } = reg;
        await fetch(`http://localhost:3000/api/gastos/${_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      } else {
        const { _id, ...data } = reg;
        await fetch("http://localhost:3000/api/gastos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      }

      // Eliminar registro de IndexedDB después de sincronizar
      await eliminarRegistroOffline(reg._id);

    } catch (error) {
      console.error("Error sincronizando registro:", reg, error);
    }
  }
}

// Escuchar cuando el usuario vuelve a estar online
window.addEventListener("online", async () => {
  console.log("Conectado de nuevo. Sincronizando registros offline...");
  await sincronizarConServidor();
});