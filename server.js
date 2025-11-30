const express = require('express');
const path = require('path');
const multer = require('multer');
const photoController = require('./src/controllers/photoController');

const app = express();
const port = 3000;

// Configuración de multer para subida de archivos CSV
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// Middleware
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// Ruta para procesar las fotos
app.post('/process-photos', upload.single('csvFile'), photoController.processPhotos);

// Iniciar servidor
app.listen(port, () => {
  console.log(`🎯 Aplicación ejecutándose en: http://localhost:${port}`);
  console.log(`📁 Para usar la aplicación, ve a: http://localhost:${port}`);
});