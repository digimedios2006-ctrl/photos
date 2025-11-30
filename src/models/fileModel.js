const fs = require('fs-extra');
const path = require('path');

exports.listFiles = async (folderPath) => {
  try {
    if (!await fs.pathExists(folderPath)) {
      throw new Error(`La carpeta no existe: ${folderPath}`);
    }
    
    const files = await fs.readdir(folderPath);
    return files.filter(file => {
      // Incluir solo archivos de imagen
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.raw', '.cr2', '.nef'].includes(ext);
    });
  } catch (error) {
    throw new Error(`Error leyendo la carpeta: ${error.message}`);
  }
};

exports.moveFiles = async (fileNames, sourceFolder, destFolder) => {
  try {
    // Crear carpeta destino si no existe
    await fs.ensureDir(destFolder);
    
    const results = {
      moved: [],
      errors: []
    };

    for (const fileName of fileNames) {
      try {
        const sourcePath = path.join(sourceFolder, fileName);
        const destPath = path.join(destFolder, fileName);
        
        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, destPath);
          results.moved.push(fileName);
          console.log(`✅ Movido: ${fileName}`);
        } else {
          results.errors.push(`Archivo no encontrado: ${fileName}`);
        }
      } catch (error) {
        results.errors.push(`Error moviendo ${fileName}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Error en operación de archivos: ${error.message}`);
  }
};