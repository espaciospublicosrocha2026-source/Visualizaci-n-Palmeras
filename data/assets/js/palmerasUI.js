import { esFuncionario } from './auth.js';

export async function mostrarDetallePalmera() {
  const contenedor = document.getElementById('detalle-palmera');
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const idPalmera = params.get('id');

  if (!idPalmera) {
    contenedor.innerHTML = '<p>ID de palmera no especificado.</p>';
    return;
  }

  const res = await fetch(`data/palmeras.json/${idPalmera}`);
  if (!res.ok) {
    contenedor.innerHTML = '<p>Palmera no encontrada.</p>';
    return;
  }

  const p = await res.json();

  const especies = ["Butia", "Syagrus", "Phoenix", "Washingtonia", "Trithrinax"];

 contenedor.innerHTML = `
  <h3>Detalle Palmera</h3>

  <form id="palmera-form">

    <label>Identificador:
      <input
        type="text"
        name="identificador"
        value="${p.identificador || ''}"
        ${esFuncionario() ? '' : 'readonly'}
      >
    </label><br>

    <label>Especie:
      <select name="especie" ${esFuncionario() ? '' : 'disabled'}>
        ${especies.map(e =>
          `<option value="${e}" ${p.especie === e ? 'selected' : ''}>${e}</option>`
        ).join('')}
      </select>
    </label><br>

    <label>Estado:
      <select name="estado" ${esFuncionario() ? '' : 'disabled'}>
        <option value="afectada" ${p.estado === 'afectada' ? 'selected' : ''}>Afectada</option>
        <option value="sana" ${p.estado === 'sana' ? 'selected' : ''}>Sana</option>
        <option value="muerta" ${p.estado === 'muerta' ? 'selected' : ''}>Muerta</option>
        <option value="tratamiento" ${p.estado === 'tratamiento' ? 'selected' : ''}>Tratamiento</option>
        <option value="revision" ${p.estado === 'revision' ? 'selected' : ''}>Revisión</option>
      </select>
    </label><br>

    <label>Gestión:
      <select name="gestion" ${esFuncionario() ? '' : 'disabled'}>
        <option value="ninguno" ${p.gestion === 'ninguno' ? 'selected' : ''}>Ninguno</option>
        <option value="cortafuego" ${p.gestion === 'cortafuego' ? 'selected' : ''}>Cortafuego</option>
        <option value="intercambio" ${p.gestion === 'intercambio' ? 'selected' : ''}>Intercambio</option>
        <option value="pago" ${p.gestion === 'pago' ? 'selected' : ''}>Tratamiento pago</option>
      </select>
    </label><br>

    <label>Privacidad:
      <select name="privacidad" ${esFuncionario() ? '' : 'disabled'}>
        <option value="publica" ${p.privacidad === 'publica' ? 'selected' : ''}>Pública</option>
        <option value="privada" ${p.privacidad === 'privada' ? 'selected' : ''}>Privada</option>
      </select>
    </label><br>

    <label>Observaciones:
      <textarea name="observaciones" ${esFuncionario() ? '' : 'readonly'}>${p.observaciones || ''}</textarea>
    </label><br>

    <label>Fecha de registro:
      <input type="date" value="${p.fecha_registro}" readonly>
    </label><br>

    <label>Última edición:
      <input type="date" value="${p.fecha_edicion || ''}" readonly>
    </label><br>

    <label>Coordenadas:
      <input type="text" value="${p.lat}, ${p.lng}" readonly>
    </label><br>

    ${esFuncionario() ? '<button type="submit">Guardar</button>' : ''}
  </form>

  <hr>

  <h3>Intervenciones</h3>
  <div id="lista-intervenciones"></div>

  ${esFuncionario() ? `
    <h4>Nueva intervención</h4>
    <input type="date" id="int-fecha">
    <input type="text" id="int-desc" placeholder="Descripción">
    <button id="agregar-intervencion">Agregar</button>
  ` : ''}
  
  <p id="msg-guardar"></p>
`;


  /* ===============================
     EDITAR PALMERA
     =============================== */
  if (esFuncionario()) {
    document.getElementById('palmera-form').addEventListener('submit', async e => {
      e.preventDefault();

      const form = e.target;
      const data = {
  identificador: form.identificador.value,
  especie: form.especie.value,
  estado: form.estado.value,
  gestion: form.gestion.value,
  observaciones: form.observaciones.value,
  privacidad: form.privacidad.value
};


      const res = await fetch(`data/palmeras.json/${idPalmera}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      document.getElementById('msg-guardar').innerText =
        res.ok ? 'Palmera actualizada correctamente' : 'Error al actualizar palmera';
    });
  }

  /* ===============================
     INTERVENCIONES
     =============================== */

  async function cargarIntervenciones() {
    const res = await fetch(`data/palmeras.json/${idPalmera}/intervenciones`);

    const datos = await res.json();

    const cont = document.getElementById('lista-intervenciones');
    cont.innerHTML = '';

    datos.forEach(i => {
      const div = document.createElement('div');
      div.innerHTML = `
        <b>${i.fecha}</b> - ${i.descripcion}
        ${esFuncionario() ? `
          <button data-id="${i.id}" class="editar">Editar</button>
          <button data-id="${i.id}" class="eliminar">Eliminar</button>
        ` : ''}
      `;
      cont.appendChild(div);

      if (esFuncionario()) {
        div.querySelector('.eliminar').onclick = async () => {
          await fetch(`/intervenciones/${i.id}`, { method: 'DELETE' });
          cargarIntervenciones();
        };

        div.querySelector('.editar').onclick = async () => {
          const nuevaDesc = prompt('Nueva descripción', i.descripcion);
          if (!nuevaDesc) return;

          await fetch(`/intervenciones/${i.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha: i.fecha, descripcion: nuevaDesc })
          });
          cargarIntervenciones();
        };
      }
    });
  }

  if (esFuncionario()) {
    document.getElementById('agregar-intervencion').onclick = async () => {
      const fecha = document.getElementById('int-fecha').value;
      const descripcion = document.getElementById('int-desc').value;

      if (!fecha || !descripcion) return;

      await fetch(`data/palmeras.json/${idPalmera}/intervenciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palmera_id: idPalmera, fecha, descripcion })
      });

      document.getElementById('int-desc').value = '';
      cargarIntervenciones();
    };
  }

  cargarIntervenciones();
}
