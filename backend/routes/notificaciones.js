import {Router} from 'express';
import { title } from 'process';
import webpush from 'web-push';

export const routerNotificaciones = Router();

const vapidKeys = {
  publicKey: "BDPYzCO5bWNreov9MkSPmoFdHy2XDv8zN8MzX0TKF2_hJYDlPQKOv1ONBOVvuRAezMpRPd0SCRXz0-wOb6RpM1k",
  privateKey: "a0IVBLOFTv5hNcdU4yP7y7GuSmDqGHJpw0CniOVNE8E",
} 

webpush.setVapidDetails(
  "mailto:correo@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const subscriptions = [];

routerNotificaciones.get('/ping', (req, res) => {
  res.json({ok: true, message:"Rutas de notificaciones funcionando" });
})

// POST /api/notificaciones/subscribe
routerNotificaciones.post("/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ ok: false, message: "Suscripción inválida" });
  }

  // Evitar duplicados simples
  const exists = subscriptions.find(
    (sub) => sub.endpoint === subscription.endpoint
  );
  if (!exists) {
    subscriptions.push(subscription);
  }

  console.log("Nueva suscripción registrada");
  console.log("Total suscripciones:", subscriptions.length);

  res.status(201).json({ ok: true });
});

// POST /api/notificaciones/send-test
routerNotificaciones.post("/send-test", async (req, res) => {
  if (subscriptions.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "No hay suscripciones registradas aún"
    });
  }

  const payload = JSON.stringify({
    title: "FinTrack",
    body: "Notificación push de prueba"
  });

  const results = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ endpoint: sub.endpoint, ok: true });
    } catch (err) {
      console.error("Error enviando notificación a", sub.endpoint, err);
      results.push({ endpoint: sub.endpoint, ok: false });
    }
  }

  res.json({ ok: true, sent: results.length, results });
});

routerNotificaciones.post("/presupuesto-superado", async (req, res) => {
  const { excedidos } = req.body || {};

  if (!Array.isArray(excedidos) || excedidos.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "No se recibieron presupuestos excedidos"
    });
  }

  if (subscriptions.length === 0) {
    return res.status(200).json({
      ok: true,
      message: "No hay suscripciones registradas, no se envió push"
    });
  }

  const results = [];

for (const p of excedidos) {
  const nombre = p.categoria === "GENERAL"
    ? "Presupuesto GENERAL"
    : `Presupuesto de ${p.categoria}`;

  const gastado = Number(p.gastado || 0).toFixed(2);
  const monto = Number(p.monto || 0).toFixed(2);

  const payload = JSON.stringify({
    title: "Presupuesto superado",
    body: `${nombre} superado: gastado $${gastado} / $${monto}`
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ endpoint: sub.endpoint, categoria: p.categoria, ok: true });
    } catch (err) {
      console.error("Error enviando notificación de presupuesto a", sub.endpoint, err);
      results.push({ endpoint: sub.endpoint, categoria: p.categoria, ok: false });
    }
  }
}

  res.json({
    ok: true,
    message: "Notificaciones de presupuesto enviadas",
    sent: results.length
  });
});

routerNotificaciones.post("/presupuesto-avance", async (req, res) => {
  const { avisosAvance } = req.body || {};

  if (!Array.isArray(avisosAvance) || avisosAvance.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "No se recibieron avisos de avance"
    });
  }

  if (subscriptions.length === 0) {
    return res.json({
      ok: true,
      message: "No hay suscripciones registradas"
    });
  }

  const results = [];

  for (const aviso of avisosAvance) {
    const nombre = aviso.categoria === "GENERAL"
      ? "Presupuesto GENERAL"
      : `Presupuesto de ${aviso.categoria}`;

    const payload = JSON.stringify({
      title: "Avance de presupuesto",
      body: `${nombre} ha alcanzado el ${aviso.porcentaje}%. Gastado $${aviso.gastado} de $${aviso.monto}.`
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: sub.endpoint, ok: true });
      } catch (err) {
        console.error("Error enviando push:", err);
        results.push({ endpoint: sub.endpoint, ok: false });
      }
    }
  }

  res.json({
    ok: true,
    message: "Notificaciones de avance enviadas",
    count: results.length
  });
});

routerNotificaciones.post("/suscripciones-recordatorio", async (req, res) => {
  const { proximas3Dias = [], hoyCobro = [] } = req.body || {};

  if (subscriptions.length === 0) {
    return res.json({
      ok: true,
      message: "No hay suscripciones push registradas"
    });
  }

  const results = [];

  // Notificaciones para suscripciones que se cobrarán en 3 días
  for (const subInfo of proximas3Dias) {
    const nombre = subInfo.descripcion || "Suscripción";
    const fechaTexto = subInfo.fecha
      ? new Date(subInfo.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "";

    const payload = JSON.stringify({
      title: "Suscripción próxima a cobrarse",
      body: `En 3 días se cobrará la suscripción "${nombre}"${fechaTexto ? ` (${fechaTexto})` : ""}.`,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: sub.endpoint, tipo: "3dias", ok: true });
      } catch (err) {
        console.error("Error enviando push (3 días):", err);
        results.push({ endpoint: sub.endpoint, tipo: "3dias", ok: false });
      }
    }
  }

  // Notificaciones para suscripciones que se cobran hoy
  for (const subInfo of hoyCobro) {
    const nombre = subInfo.descripcion || "Suscripción";
    const fechaTexto = subInfo.fecha
      ? new Date(subInfo.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "";

    const payload = JSON.stringify({
      title: "Cobro de suscripción hoy",
      body: `Hoy se cobrará la suscripción "${nombre}"${fechaTexto ? ` (${fechaTexto})` : ""}.`,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: sub.endpoint, tipo: "hoy", ok: true });
      } catch (err) {
        console.error("Error enviando push (hoy):", err);
        results.push({ endpoint: sub.endpoint, tipo: "hoy", ok: false });
      }
    }
  }

  return res.json({
    ok: true,
    message: "Notificaciones de suscripciones enviadas",
    count: results.length,
  });
});