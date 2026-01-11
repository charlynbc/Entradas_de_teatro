/**
 * MODAL DE FOTO DE PERFIL
 * Captura con cámara o sube archivo
 * Compatible con: director, actor, super usuario
 */

let videoStream = null;
let canvas = null;
let ctx = null;

function abrirModalFoto() {
  const modal = document.getElementById('modalFotoPerfil');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function cerrarModalFoto() {
  detenerCamara();
  const modal = document.getElementById('modalFotoPerfil');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

async function iniciarCamara() {
  try {
    const video = document.getElementById('videoCaptura');
    if (!video) return;

    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = videoStream;

    // Mostrar video, ocultar otros
    document.getElementById('videoCaptura').style.display = 'block';
    document.getElementById('previewFoto').style.display = 'none';
    document.getElementById('inputArchivo').style.display = 'none';
    document.getElementById('btnCapturar').style.display = 'inline-block';
    document.getElementById('btnSubir').style.display = 'none';
    document.getElementById('btnSacar').style.display = 'none';

  } catch (error) {
    console.error('Error al acceder a la cámara:', error);
    alert('No se pudo acceder a la cámara. Intenta subir un archivo.');
  }
}

function detenerCamara() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

function capturarFoto() {
  const video = document.getElementById('videoCaptura');
  const preview = document.getElementById('previewFoto');
  
  if (!canvas) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  }

  // Configurar canvas con dimensiones del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Dibujar frame actual del video
  ctx.drawImage(video, 0, 0);

  // Mostrar preview
  const dataUrl = canvas.toDataURL('image/jpeg');
  preview.src = dataUrl;
  preview.style.display = 'block';
  video.style.display = 'none';

  // Actualizar botones
  document.getElementById('btnCapturar').style.display = 'none';
  document.getElementById('btnSacar').style.display = 'inline-block';
  document.getElementById('btnSubir').style.display = 'inline-block';

  // Guardar para upload
  window.fotoCapturada = dataUrl;
}

function sacarOtraFoto() {
  document.getElementById('videoCaptura').style.display = 'block';
  document.getElementById('previewFoto').style.display = 'none';
  document.getElementById('btnCapturar').style.display = 'inline-block';
  document.getElementById('btnSacar').style.display = 'none';
  document.getElementById('btnSubir').style.display = 'none';
  window.fotoCapturada = null;
}

function modoArchivo() {
  detenerCamara();
  document.getElementById('videoCaptura').style.display = 'none';
  document.getElementById('previewFoto').style.display = 'none';
  document.getElementById('inputArchivo').style.display = 'block';
  document.getElementById('btnCapturar').style.display = 'none';
  document.getElementById('btnSacar').style.display = 'none';
  document.getElementById('btnSubir').style.display = 'inline-block';
}

function previewArchivo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('previewFoto');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('inputArchivo').style.display = 'none';
    window.fotoCapturada = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function subirFoto() {
  try {
    const fotoData = window.fotoCapturada;
    if (!fotoData) {
      alert('Debes capturar o seleccionar una foto');
      return;
    }

    const btnSubir = document.getElementById('btnSubir');
    const btnOrigen = btnSubir.textContent;
    btnSubir.disabled = true;
    btnSubir.textContent = 'Subiendo...';

    // Paso 1: Subir imagen
    const uploadRes = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        image: fotoData,
        filename: 'foto-perfil.jpg'
      })
    });

    if (!uploadRes.ok) {
      throw new Error(`Error en upload: ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json();
    const imageUrl = uploadData.url;

    // Paso 2: Actualizar en BD
    const updateRes = await fetch('/api/usuarios/foto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!updateRes.ok) {
      throw new Error('Error al actualizar foto de perfil');
    }

    // Éxito
    alert('✅ Foto de perfil actualizada');
    
    // Actualizar la foto en la página
    const fotoEls = document.querySelectorAll('#fotoUsuario, #ver-usuario-foto');
    fotoEls.forEach(el => {
      el.src = imageUrl;
    });

    // Recargar perfil si es necesario
    if (window.cargarPerfil) window.cargarPerfil();

    cerrarModalFoto();
  } catch (error) {
    console.error('Error subiendo foto:', error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    document.getElementById('btnSubir').disabled = false;
    document.getElementById('btnSubir').textContent = 'Guardar Foto';
  }
}

// Crear y inyectar el modal en el HTML
function inyectarModalFoto() {
  if (document.getElementById('modalFotoPerfil')) return;

  const modalHTML = `
<div id="modalFotoPerfil" class="modal" style="display: none;">
  <div class="modal-content" style="max-width: 500px;">
    <button class="modal-close" onclick="cerrarModalFoto()">
      <i class="fas fa-times"></i>
    </button>

    <h2 style="color: #12090D; margin-top: 0;">Foto de Perfil</h2>

    <!-- Video -->
    <video id="videoCaptura" 
           style="width: 100%; border-radius: 8px; background: #000; display: none; margin-bottom: 15px;"
           autoplay playsinline>
    </video>

    <!-- Preview -->
    <img id="previewFoto" 
         style="width: 100%; border-radius: 8px; display: none; margin-bottom: 15px;"
         alt="Preview">

    <!-- Input archivo -->
    <input id="inputArchivo" 
           type="file" 
           accept="image/*"
           style="width: 100%; padding: 10px; border: 2px dashed #F48C06; border-radius: 8px; display: none; margin-bottom: 15px;"
           onchange="previewArchivo(event)">

    <!-- Botones -->
    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
      <button id="btnIniciaCamara" 
              class="btn btn-primary" 
              onclick="iniciarCamara()"
              style="flex: 1; min-width: 120px;">
        <i class="fas fa-camera"></i> Cámara
      </button>

      <button id="btnModoArchivo"
              class="btn btn-secondary" 
              onclick="modoArchivo()"
              style="flex: 1; min-width: 120px;">
        <i class="fas fa-upload"></i> Archivo
      </button>

      <button id="btnCapturar"
              class="btn btn-success"
              onclick="capturarFoto()"
              style="flex: 1; min-width: 120px; display: none;">
        <i class="fas fa-camera"></i> Capturar
      </button>

      <button id="btnSacar"
              class="btn btn-secondary"
              onclick="sacarOtraFoto()"
              style="flex: 1; min-width: 120px; display: none;">
        <i class="fas fa-redo"></i> Otra foto
      </button>

      <button id="btnSubir"
              class="btn btn-success"
              onclick="subirFoto()"
              style="flex: 1; min-width: 120px; display: none;">
        <i class="fas fa-check"></i> Guardar Foto
      </button>
    </div>

    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 15px;">
      Usa tu cámara o sube una foto. La imagen se recortará en círculo.
    </p>
  </div>
</div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Inicializar modal al cargar
document.addEventListener('DOMContentLoaded', inyectarModalFoto);
