const csvModel = require('../models/csvModel');
const fileModel = require('../models/fileModel');
const fileUtils = require('../utils/fileUtils');

exports.processPhotos = async (req, res) => {
  try {
    const { photosFolder, outputFolder } = req.body;
    const csvFilePath = req.file.path;

    console.log('📂 Procesando solicitud...');
    console.log('📁 Carpeta fotos:', photosFolder);
    console.log('📁 Carpeta destino:', outputFolder);
    console.log('📄 Archivo CSV:', csvFilePath);

    // 1. Leer códigos del CSV
    const codes = await csvModel.readCSV(csvFilePath);
    console.log('📋 Códigos encontrados:', codes);

    // 2. Listar archivos en la carpeta de fotos
    const files = await fileModel.listFiles(photosFolder);
    console.log('🖼️ Archivos en carpeta:', files.length);

    // 3. Encontrar coincidencias (ahora con validación)
    const { matches, missingCodes, codeFilesMap, totalProcessed, foundCount, missingCount } = fileUtils.findMatches(codes, files);
    
    console.log('✅ Coincidencias encontradas:', matches.length);
    console.log('❌ Códigos faltantes:', missingCodes);

    // 4. Mover archivos (solo si hay coincidencias)
    let results = { moved: [], errors: [] };
    if (matches.length > 0) {
      results = await fileModel.moveFiles(matches, photosFolder, outputFolder);
    }

    // Determinar el estado del proceso
    const hasMissingCodes = missingCount > 0;
    const hasErrors = results.errors.length > 0;
    
    let status = 'success';
    let message = '';
    
    if (matches.length === 0) {
      status = 'error';
      message = '❌ No se encontraron coincidencias para ningún código';
    } else if (hasMissingCodes && hasErrors) {
      status = 'warning';
      message = `⚠️ Se movieron ${matches.length} fotos, pero ${missingCount} códigos no se encontraron y hubo ${results.errors.length} errores`;
    } else if (hasMissingCodes) {
      status = 'warning';
      message = `⚠️ Se movieron ${matches.length} fotos, pero ${missingCount} códigos no se encontraron`;
    } else if (hasErrors) {
      status = 'warning';
      message = `⚠️ Se movieron ${matches.length} fotos, pero hubo ${results.errors.length} errores`;
    } else {
      message = `✅ Se movieron ${matches.length} fotos a la carpeta: ${outputFolder}`;
    }

    res.json({
      success: status !== 'error',
      status: status,
      message: message,
      details: {
        totalCodes: totalProcessed,
        totalFiles: files.length,
        matchesFound: matches.length,
        movedFiles: results.moved,
        errors: results.errors,
        missingCodes: missingCodes,
        missingCount: missingCount,
        codeFilesMap: codeFilesMap
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Error procesando las fotos: ' + error.message
    });
  }
};