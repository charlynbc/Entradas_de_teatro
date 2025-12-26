import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Asegurar que el directorio de uploads existe
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadImage(req, res) {
  try {
    await ensureUploadDir();

    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    // Validar que sea base64
    const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    if (!base64Pattern.test(image)) {
      return res.status(400).json({ error: 'Formato de imagen inválido. Debe ser base64' });
    }

    // Extraer el tipo de imagen y los datos
    const matches = image.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'No se pudo procesar la imagen' });
    }

    const imageType = matches[1];
    const imageData = matches[2];

    // Generar nombre único
    const randomName = crypto.randomBytes(16).toString('hex');
    const finalFilename = filename 
      ? `${path.parse(filename).name}-${randomName}.${imageType}`
      : `${randomName}.${imageType}`;

    // Guardar archivo
    const filepath = path.join(UPLOAD_DIR, finalFilename);
    await fs.writeFile(filepath, Buffer.from(imageData, 'base64'));

    // Retornar URL pública
    const publicUrl = `/uploads/${finalFilename}`;

    res.json({
      ok: true,
      url: publicUrl,
      mensaje: 'Imagen subida correctamente'
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteImage(req, res) {
  try {
    const { url } = req.body;

    if (!url || !url.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    const filename = path.basename(url);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Verificar que existe antes de eliminar
    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
      res.json({ ok: true, mensaje: 'Imagen eliminada correctamente' });
    } catch {
      res.status(404).json({ error: 'Imagen no encontrada' });
    }
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ error: error.message });
  }
}
