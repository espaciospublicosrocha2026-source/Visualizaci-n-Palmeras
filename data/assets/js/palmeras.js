import express from 'express';
import { db } from '../database.js';

const router = express.Router();

/* ===============================
   GET todas las palmeras
=============================== */
router.get('/', async (req, res) => {
  try {
    const palmeras = await db.all('SELECT * FROM palmeras');
    res.json(palmeras);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener palmeras' });
  }
});

/* ===============================
   POST crear palmera
=============================== */
router.post('/', async (req, res) => {
  try {
    const {
      identificador,
      lat,
      lng,
      especie,
      estado,
      gestion,
      observaciones,
      privacidad,
      fecha_registro
    } = req.body;

    const result = await db.run(
      `
      INSERT INTO palmeras
      (identificador, lat, lng, especie, estado, gestion, observaciones, privacidad, fecha_registro, fecha_edicion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      [
        identificador || null,
        lat,
        lng,
        especie || 'Palmera',
        estado,
        gestion || 'ninguno',
        observaciones || '',
        privacidad || 'publica',
        fecha_registro || new Date().toISOString().split('T')[0]
      ]
    );

    res.json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear palmera' });
  }
});

/* ===============================
   PUT editar palmera (FICHA)
=============================== */
router.put('/:id', async (req, res) => {
  try {
    const {
      identificador,
      especie,
      estado,
      gestion,
      observaciones,
      privacidad
    } = req.body;

    await db.run(
      `
      UPDATE palmeras
      SET identificador = COALESCE(?, identificador),
          especie = COALESCE(?, especie),
          estado = COALESCE(?, estado),
          gestion = COALESCE(?, gestion),
          observaciones = COALESCE(?, observaciones),
          privacidad = COALESCE(?, privacidad),
          fecha_edicion = datetime('now')
      WHERE id = ?
      `,
      [
        identificador,
        especie,
        estado,
        gestion,
        observaciones,
        privacidad,
        req.params.id
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar palmera' });
  }
});

/* ===============================
   PUT mover palmera (UBICACIÓN)
=============================== */
router.put('/:id/ubicacion', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    await db.run(
      `
      UPDATE palmeras
      SET lat = ?, lng = ?, fecha_edicion = datetime('now')
      WHERE id = ?
      `,
      [lat, lng, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

/* ===============================
   DELETE palmera
=============================== */
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM palmeras WHERE id = ?', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar palmera' });
  }
});

export default router;
