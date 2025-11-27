// backend/routes/notificaciones.js
import { Router } from "express";
import webpush from "web-push";

export const routerNotificaciones = Router();

// 👇 TUS KEYS (las que ya generaste)
const vapidKeys = {
  publicKey: "BDPYzCO5bWNreov9MkSPmoFdHy2XDv8zN8MzX0TKF2_hJYDlPQKOv1ONBOVvuRAezMpRPd0SCRXz0-wOb6RpM1k",
  privateKey: "a0IVBLOFTv5hNcdU4yP7y7GuSmDqGHJpw0CniOVNE8E"
};

webpush.setVapidDetails(
  "mailto:correo@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Guardamos suscripciones en memoria (para pruebas)
const subscriptions = [];

// POST /api/subscribe
routerNotificaciones.post("/subscribe", (req, res) => {
  const subscription = req.body;

  const exists = subscriptions.find(
    (sub) => JSON.stringify(sub) === JSON.stringify(subscription)
  );
  if (!exists) {
    subscriptions.push(subscription);
  }

  console.log("📩 Nueva suscripción recibida");
  console.log("Total suscripciones:", subscriptions.length);

  res.status(201).json({ message: "Suscripción guardada" });
});

// POST /api/send-notification
routerNotificaciones.post("/send-notification", async (req, res) => {
  const payload = JSON.stringify({
    title: "FinTrack",
    body: "Notificación push desde el servidor 🚀",
  });

  const promises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, payload).catch((err) => {
      console.error("Error enviando push:", err);
    })
  );

  await Promise.all(promises);

  res.json({ message: "Notificaciones enviadas" });
});
