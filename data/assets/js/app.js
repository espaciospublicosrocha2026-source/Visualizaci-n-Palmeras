import { initMap } from './initMap.js';
import { mostrarLogin, estaLogueado } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ===============================
  // MAPA
  // ===============================
  const map = initMap();
  const drawnItems = L.featureGroup().addTo(map);

  // ===============================
  // LOGIN
  // ===============================
  mostrarLogin();

  // ===============================
  // COLORES POR ESTADO
  // ===============================
  function colorPorEstado(estado) {
    if (estado === 'sana') return 'green';
    if (estado === 'tratada') return 'orange';
    if (estado === 'a_extraer') return 'yellow';
    if (estado === 'muerta') return 'red';
    return 'blue';
  }

  // ===============================
  // CARGAR PALMERAS
  // ===============================
  async function cargarPalmeras() {
    const res = await fetch('/palmeras');
    const palmeras = await res.json();

    drawnItems.clearLayers();

    palmeras.forEach(p => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 8,
        fillColor: colorPorEstado(p.estado),
        color: '#000',
        weight: 1,
        fillOpacity: 0.8
      }).addTo(drawnItems);

      // -------------------------------
      // POPUP (FORMULARIO DE EDICIÓN)
      // -------------------------------
      marker.bindPopup(`
        <form id="edit-${p.id}">
          <strong>Editar palmera</strong><br>

          <label>Tipo</label><br>
          <input name="tipo" value="${p.tipo}" ${estaLogueado() ? '' : 'readonly'}><br>

          <label>Estado</label><br>
          <select name="estado" ${estaLogueado() ? '' : 'disabled'}>
            <option value="sana" ${p.estado === 'sana' ? 'selected' : ''}>Sana</option>
            <option value="tratada" ${p.estado === 'tratada' ? 'selected' : ''}>Tratada</option>
            <option value="a_extraer" ${p.estado === 'a_extraer' ? 'selected' : ''}>A extraer</option>
            <option value="muerta" ${p.estado === 'muerta' ? 'selected' : ''}>Muerta</option>
          </select><br>

          <label>Observaciones</label><br>
          <textarea name="observaciones">${p.observaciones || ''}</textarea><br>

          ${estaLogueado() ? '<button type="submit">Guardar</button>' : ''}
        </form>
      `);

      // -------------------------------
      // SUBMIT DEL FORMULARIO (UNA SOLA VEZ)
      // -------------------------------
      marker.on('popupopen', () => {
        if (!estaLogueado()) return;

        const form = document.getElementById(`edit-${p.id}`);
        if (!form) return;

        // evitar listeners duplicados
        if (form.dataset.bound) return;
        form.dataset.bound = 'true';

        form.addEventListener('submit', async e => {
          e.preventDefault();

          const data = {
            tipo: form.tipo.value,
            estado: form.estado.value,
            observaciones: form.observaciones.value
          };

          await fetch(`/palmeras/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          map.closePopup();
          await cargarPalmeras();
        });
      });
    });
  }

  // ===============================
  // CARGA INICIAL
  // ===============================
  await cargarPalmeras();

  // ===============================
  // DRAW – SOLO SI ESTÁ LOGUEADO
  // ===============================
  if (estaLogueado()) {
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems, remove: false },
      draw: {
        circlemarker: true,
        marker: false,
        polygon: false,
        rectangle: false,
        polyline: false,
        circle: false
      }
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, async e => {
      const latlng = e.layer.getLatLng();

      const nuevaPalmera = {
        lat: latlng.lat,
        lng: latlng.lng,
        tipo: 'Palmera',
        estado: 'sana',
        observaciones: ''
      };

      await fetch('/palmeras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaPalmera)
      });

      await cargarPalmeras();
    });
  }
});
