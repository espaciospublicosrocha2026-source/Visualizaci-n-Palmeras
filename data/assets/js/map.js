// ===============================
// MAPA
// ===============================
const map = L.map('map', {
  center: [-34.48, -54.33],
  zoom: 12,
  maxZoom: 22   // 🔥 forzás zoom alto
});

const openStreetMap = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
);

const baseMaps = {
  "OpenStreetMap": openStreetMap
};

// Añadir la capa base visible por defecto
openStreetMap.addTo(map);

// Si querés que la capa de la laguna aparezca al inicio, descomentar la línea siguiente
// lagunaRochaSanAntonio.addTo(map);

L.control.layers(baseMaps, overlays).addTo(map);

// ======== Control de localización ========
L.Control.Locate = L.Control.extend({
  onAdd: function(map) {
    const btn = L.DomUtil.create('button', 'leaflet-bar');
    btn.innerHTML = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#4285F4"/>
</svg>
`;

    btn.title = 'Mostrar mi ubicación';
    btn.style.padding = '4px';
    btn.style.fontSize = '18px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => locateMe();
    return btn;
  },
  onRemove: function(map) {}
});

L.control.locate = function(opts) {
  return new L.Control.Locate(opts);
}
L.control.locate({ position: 'topleft' }).addTo(map);

// ===============================
// ===============================
// LayerGroups
// ===============================
const departamentosLayer = L.layerGroup().addTo(map); // GeoJSON de departamentos
const puntosJSONLayer = L.layerGroup().addTo(map);    // JSON adicional (uruguay.json)

// ===============================
const palmerasLayer = L.markerClusterGroup({
  pane: 'paneClusters',

  chunkedLoading: true,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: false,
  zoomToBoundsOnClick: false,
  disableClusteringAtZoom: 17,

  maxClusterRadius: 35,

  iconCreateFunction: cluster => {
    const count = cluster.getChildCount();

    const size = 34; // 🔒 tamaño fijo SIEMPRE

    return L.divIcon({
      html: `
        <div class="cluster-palmera" style="
          width:${size}px;
          height:${size}px;
        ">
          <span>${count}</span>
        </div>
      `,
      className: '',
      iconSize: [size, size]
    });
  }
});



map.addLayer(palmerasLayer);

// ===============================
// Cargar GeoJSON de Uruguay
// ===============================
fetch('data/uruguay.geojson')
  .then(res => res.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      style: {
        color: '#649163',
        weight: 2,
        fillOpacity: 0.1
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.NOMBRE) {
          layer.bindPopup(feature.properties.NOMBRE);
        }
      }
    }).addTo(departamentosLayer);
  })
  .catch(err => console.error('Error cargando GeoJSON:', err));

// ===============================
// Cargar JSON adicional de Uruguay
fetch('data/uruguay.json')
  .then(res => res.json())
  .then(data => {

    // Adaptarse a distintos formatos
    const puntos = Array.isArray(data)
      ? data
      : data.puntos || data.features || [];

    puntos.forEach(item => {

      // Caso GeoJSON
      let lat, lng, nombre;

      if (item.geometry && item.geometry.coordinates) {
        lng = item.geometry.coordinates[0];
        lat = item.geometry.coordinates[1];
        nombre = item.properties?.nombre;
      } 
      // Caso JSON simple
      else {
        lat = item.lat;
        lng = item.lng;
        nombre = item.nombre;
      }

      if (!lat || !lng) return;

      L.circleMarker([lat, lng], {
        radius: 5,
        color: 'blue',
        fillOpacity: 0.7
      })
        .bindPopup(nombre || '')
        .addTo(puntosJSONLayer);
    });

  })
  .catch(err => console.error('Error cargando JSON:', err));


let miUbicacionMarker = null;

function locateMe() {
  if (!navigator.geolocation) {
    alert('Geolocalización no soportada en este navegador');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Si ya hay un marker, lo eliminamos
      if (miUbicacionMarker) map.removeLayer(miUbicacionMarker);

      // Crear marcador estilo gota azul (como tus palmeras)
      const color = '#1E90FF'; // azul
      const pinIcon = L.divIcon({
        className: '',
        html: `
          <svg width="16" height="32" viewBox="0 0 16 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0 C4 0, 0 4, 0 8 C0 16, 8 32, 8 32 C8 32, 16 16, 16 8 C16 4, 12 0, 8 0 Z" 
                  fill="${color}" stroke="black" stroke-width="0.8"/>
            <circle cx="8" cy="8" r="3" fill="white" stroke="black" stroke-width="0.8"/>
          </svg>
        `,
        iconSize: [16, 32],
        iconAnchor: [8, 32]
      });

      miUbicacionMarker = L.marker([lat, lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup('¡Aquí estás!').openPopup();

      // Centrar mapa en posición
      map.setView([lat, lng], 15);
    },
    (err) => {
      console.error(err);
      alert('No se pudo obtener la ubicación');
    },
    { enableHighAccuracy: true }
  );
}
let palmerasData = [];
let palmerasMarkers = [];
let filtros = {
  estado: 'todos',
  privacidad: 'todas',
  especie: 'todas',
  gestion: 'todas'
};
let latlngFormulario = null;

// ===============================
// FILTROS
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // --- Filtro por estado ---
  const filtroEstado = document.getElementById('filtro-estado');
  if (filtroEstado) {
    filtroEstado.addEventListener('change', e => {
      filtros.estado = e.target.value;
      console.log('Filtros activos:', filtros);
      cargarPalmeras();
    });
  }

  // --- Filtro por privacidad ---
  const filtroPrivacidad = document.getElementById('filtro-privacidad');
  if (filtroPrivacidad) {
    filtroPrivacidad.addEventListener('change', e => {
      filtros.privacidad = e.target.value;
      console.log('Filtros activos:', filtros);
      cargarPalmeras();
    });
  }

  // --- Filtro por especie ---
  const filtroEspecie = document.getElementById('filtro-especie');
  if (filtroEspecie) {
    filtroEspecie.addEventListener('change', e => {
      filtros.especie = e.target.value;
      console.log('Filtros activos:', filtros);
      cargarPalmeras();
    });
  }

  // --- Filtro por gestión ---
  const filtroGestion = document.getElementById('filtro-gestion');
  if (filtroGestion) {
    filtroGestion.addEventListener('change', e => {
      filtros.gestion = e.target.value;
      console.log('Filtros activos:', filtros);
      cargarPalmeras();
    });
  }
});


function crearIconoPalmera(color) {
  return L.divIcon({
    className: 'icono-palmera',
    html: `
<svg width="44" height="60" viewBox="0 0 32 42"
     xmlns="http://www.w3.org/2000/svg">

  <!-- SOMBRA -->
  <defs>
    <filter id="sombra" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1.8" stdDeviation="1.8"
        flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- HOJAS -->
  <g
    filter="url(#sombra)"
    stroke="${color}"
    stroke-width="2.6"
    fill="none"
    stroke-linecap="round"
  >
    <path d="M16 9 C9 6, 5 9, 3 13" />
    <path d="M16 9 C7 8, 5 12, 5 17" />
    <path d="M16 9 C11 10, 9 15, 9 22" />

    <path d="M16 9 C21 10, 23 15, 23 22" />
    <path d="M16 9 C25 8, 27 12, 27 17" />
    <path d="M16 9 C23 6, 27 9, 29 13" />
  </g>

  <!-- TRONCO -->
  <rect
    x="14.6"
    y="14"
    width="2.8"
    height="18"
    rx="1.4"
    fill="#8b5a2b"
    stroke="#2d1b10"
    stroke-width="1"
    filter="url(#sombra)"
  />

</svg>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 60],
    popupAnchor: [0, -46]
  });
}

// ===============================
// FUNCIÓN DE FILTRADO GENERAL
// ===============================
function cumpleFiltros(p) {
  const gestionPalmera = p.gestion ?? 'ninguno';

  if (filtros.estado !== 'todos' && p.estado !== filtros.estado) return false;
  if (filtros.privacidad !== 'todas' && p.privacidad !== filtros.privacidad) return false;
  if (filtros.especie !== 'todas' && p.especie !== filtros.especie) return false;
  if (filtros.gestion !== 'todas' && gestionPalmera !== filtros.gestion) return false;

  return true;
}

// ===============================
// Cargar palmeras (DRAG + GUARDADO)
// ===============================
async function cargarPalmeras() {
  try {
    const res = await fetch('data/palmeras.json');
    const palmeras = await res.json();

    palmerasLayer.clearLayers();

    palmeras.forEach(p => {

      if (!cumpleFiltros(p)) return;
      if (p.lat == null || p.lng == null) return;

      const color = {
        sana: '#0B9915',
        afectada: '#B50000',
        muerta: '#000000',
        tratamiento: '#C1D420',
        revision: '#919191'
      }[p.estado] || '#6c757d';

      const pinIcon = crearIconoPalmera(color);

      const marker = L.marker([p.lat, p.lng], {
        icon: pinIcon,
        draggable: true
      });

      // ===============================
      // DRAG → GUARDAR UBICACIÓN
      // ===============================
      marker.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();

        try {
          const res = await fetch(`data/palmeras.json/${p.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
              lat,
              lng,
              fecha_edicion: new Date().toISOString().split('T')[0]
            })
          });

          if (!res.ok) throw new Error();

          console.log(`Palmera ${p.id} movida`);

        } catch (error) {
          console.error(error);
          alert('No se pudo guardar la nueva ubicación');
        }
      });

      marker.on('click', e => {
        L.DomEvent.stopPropagation(e);
        abrirFormulario(p);
      });

      palmerasLayer.addLayer(marker);

    }); // cierre forEach

  } catch (err) {
    console.error('Error cargando palmeras:', err);
  }
} // cierre cargarPalmeras

// ===============================
// Formulario ver / editar / eliminar
// ===============================
function abrirFormulario(palmera = null, latlng = null) {
  const logueado = window.estaLogueado();
  const esNueva = !palmera;
  const especies = ["Butia", "Syagrus (Pindó)", "Phoenix", "Washingtonia"];

  // Coordenadas persistidas del formulario
  const latlngFormulario = latlng
    ? { lat: latlng.lat, lng: latlng.lng }
    : { lat: palmera.lat, lng: palmera.lng };

  // 🧼 Normalizar fechas para input type="date"
  const fechaRegistro = palmera?.fecha_registro
    ? palmera.fecha_registro.split(' ')[0]
    : new Date().toISOString().split('T')[0];

  const fechaEdicion = palmera?.fecha_edicion
    ? palmera.fecha_edicion.split(' ')[0]
    : new Date().toISOString().split('T')[0];

  const html = `
<form id="form-palmera">
  <div class="form-row">
    <div class="form-col">

<div class="form-field">
  <label>Identificador:</label>
  <input
    type="number"
    id="identificador"
    min="0"
    max="99999"
    ${!logueado ? 'readonly' : ''}
    value="${palmera?.identificador ?? ''}"
    placeholder="Ej: 12345"
  >
</div>

      <div class="form-field">
        <label>Especie:</label>
        <select id="especie" ${!logueado ? 'disabled' : ''}>
          ${especies
            .map(
              e =>
                `<option value="${e}" ${
                  palmera?.especie === e ? 'selected' : ''
                }>${e}</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="form-field">
        <label>Estado:</label>
        <select id="estado" ${!logueado ? 'disabled' : ''}>
          <option value="afectada" ${palmera?.estado === 'afectada' ? 'selected' : ''}>Afectada</option>
          <option value="sana" ${palmera?.estado === 'sana' ? 'selected' : ''}>Sana</option>
          <option value="muerta" ${palmera?.estado === 'muerta' ? 'selected' : ''}>Muerta</option>
          <option value="tratamiento" ${palmera?.estado === 'tratamiento' ? 'selected' : ''}>Tratamiento</option>
          <option value="revision" ${palmera?.estado === 'revision' ? 'selected' : ''}>Revisión</option>
        </select>
      </div>

      <div class="form-field">
        <label>Privacidad:</label>
        <select id="privacidad" ${!logueado ? 'disabled' : ''}>
          <option value="publica" ${palmera?.privacidad === 'publica' ? 'selected' : ''}>Pública</option>
          <option value="privada" ${palmera?.privacidad === 'privada' ? 'selected' : ''}>Privada</option>
        </select>
      </div>
    </div>
	<div class="form-field">
  <label>Tipo de gestión:</label>
  <select id="gestion" ${!logueado ? 'disabled' : ''}>
    <option value="ninguno" ${palmera?.gestion === 'ninguno' ? 'selected' : ''}>Ninguno</option>
    <option value="cortafuego" ${palmera?.gestion === 'cortafuego' ? 'selected' : ''}>Cortafuego</option>
    <option value="intercambio" ${palmera?.gestion === 'intercambio' ? 'selected' : ''}>Intercambio</option>
    <option value="pago" ${palmera?.gestion === 'pago' ? 'selected' : ''}>Tratamiento pago</option>
  </select>
</div>
    <div class="form-col">
      <div class="form-field">
        <label>Fecha registro:</label>
        <input
          type="date"
          id="fecha_registro"
          value="${fechaRegistro}"
          readonly
        >
      </div>

      <div class="form-field">
        <label>Última edición:</label>
        <input
          type="date"
          id="fecha_edicion"
          value="${fechaEdicion}"
          readonly
        >
      </div>

      <div class="form-field">
        <label>Coordenadas:</label>
        <input
          type="text"
          id="coordenadas"
          value="${latlngFormulario.lat}, ${latlngFormulario.lng}"
          readonly
        >
      </div>
    </div>
  </div>

  <div class="form-field" style="flex-direction: column;">
    <label>Observaciones:</label>
    <textarea id="observaciones" ${!logueado ? 'readonly' : ''}>${palmera?.observaciones || ''}</textarea>
  </div>

  <div class="form-field" style="flex-direction: column;">
    <label>Intervenciones realizadas:</label>
    <div id="lista-intervenciones"></div>

    ${
      logueado
        ? `<button type="button" id="btn-agregar-intervencion">+ Agregar intervención</button>`
        : ''
    }
  </div>

  ${logueado ? `<button type="submit">Guardar</button>` : ''}
  ${logueado && !esNueva ? `<button type="button" id="btn-eliminar">Eliminar</button>` : ''}
  ${!esNueva ? `
  <button type="button" id="btn-detalle">
    🔎 Ver detalles completos
  </button>
` : ''}

</form>
`;

  const popup = L.popup()
    .setLatLng([latlngFormulario.lat, latlngFormulario.lng])
    .setContent(html)
    .openOn(map);

setTimeout(() => {

  const btnDetalle = document.getElementById('btn-detalle');
  if (btnDetalle && palmera?.id) {
    btnDetalle.addEventListener('click', () => {
      window.location.href = `/palmeras.html?id=${palmera.id}`;
    });
  }

  if (!logueado) return;

  const form = document.getElementById('form-palmera');
  if (!form) return;

  const lista = document.getElementById('lista-intervenciones');
  const btnAgregar = document.getElementById('btn-agregar-intervencion');

  // ===============================
  // CARGAR INTERVENCIONES EXISTENTES
  // ===============================
  if (palmera && palmera.id) {

    fetch(`/palmeras/${palmera.id}/intervenciones`)
      .then(res => res.json())
      .then(intervenciones => {

        lista.innerHTML = '';

        intervenciones.forEach(i => {

          const div = document.createElement('div');
          div.className = 'intervencion-item';
          div.style.display = 'flex';
          div.style.gap = '8px';
          div.style.marginBottom = '6px';
          div.dataset.id = i.id;

          div.innerHTML = `
            <input type="date" class="intervencion-fecha" value="${i.fecha}">
            <input type="text" class="intervencion-desc" value="${i.descripcion}" style="flex:1">
            <button type="button" class="btn-eliminar-intervencion">🗑️</button>
          `;

          div.querySelector('.btn-eliminar-intervencion')
            .addEventListener('click', async () => {

              if (!confirm('¿Eliminar intervención?')) return;

              await fetch(`/intervenciones/${i.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
              });

              div.dataset.eliminada = 'true';
              div.style.display = 'none';
            });

          lista.appendChild(div);
        });

      })
      .catch(err => console.error('Error cargando intervenciones:', err));
  }

  // ===============================
  // AGREGAR NUEVA INTERVENCIÓN
  // ===============================
  btnAgregar?.addEventListener('click', () => {

    const div = document.createElement('div');
    div.className = 'intervencion-item';
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.style.marginBottom = '6px';

    div.innerHTML = `
      <input type="date" class="intervencion-fecha">
      <input type="text" class="intervencion-desc" placeholder="Qué se hizo (producto, dosis, acción)" style="flex:1">
    `;

    lista.appendChild(div);
  });

  // ===============================
  // SUBMIT
  // ===============================
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = true;

    try {

      const data = {
        fecha_registro: document.getElementById('fecha_registro').value,
        fecha_edicion: new Date().toISOString().split('T')[0],
        especie: document.getElementById('especie').value,
        estado: document.getElementById('estado').value,
        gestion: document.getElementById('gestion').value,
        privacidad: document.getElementById('privacidad').value,
        observaciones: document.getElementById('observaciones').value,
        lat: latlngFormulario.lat,
        lng: latlngFormulario.lng,
        identificador: document.getElementById('identificador').value
      };

      let palmeraId;

      if (esNueva) {

        const res = await fetch('/palmeras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();
        const creada = await res.json();
        palmeraId = creada.id;

      } else {

        palmeraId = palmera.id;

        await fetch(`/palmeras/${palmeraId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify(data)
        });
      }

      // Guardar intervenciones
      for (const div of lista.querySelectorAll('.intervencion-item')) {

        if (div.dataset.eliminada === 'true') continue;

        const fecha = div.querySelector('.intervencion-fecha')?.value;
        const descripcion = div.querySelector('.intervencion-desc')?.value;
        const intervencionId = div.dataset.id;

        if (!fecha || !descripcion) continue;

        if (intervencionId) {

          await fetch(`/intervenciones/${intervencionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ fecha, descripcion })
          });

        } else {

          await fetch(`/palmeras/${palmeraId}/intervenciones`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ fecha, descripcion })
          });
        }
      }

      map.closePopup();
      cargarPalmeras();

    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar');
    }
  });

  // ===============================
  // ELIMINAR PALMERA
  // ===============================
  if (!esNueva) {

    const btnEliminar = document.getElementById('btn-eliminar');

    btnEliminar?.addEventListener('click', async () => {

      if (!confirm('¿Eliminar palmera?')) return;

      await fetch(`/palmeras/${palmera.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      map.closePopup();
      cargarPalmeras();
    });
  }

}, 100);
} 

// ===============================
// Click para AGREGAR
// ===============================
map.off('click');

map.on('click', e => {
  if (!localStorage.getItem("token")) return;
  abrirFormulario(null, e.latlng);
});


// ===============================
// INIT
// ===============================
cargarPalmeras();

