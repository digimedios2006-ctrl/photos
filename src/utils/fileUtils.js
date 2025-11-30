const path = require('path');

exports.findMatches = (codes, files) => {
  const matches = [];
  const foundCodes = new Set(); // Para trackear códigos encontrados
  const codeFilesMap = {}; // Mapa de código -> archivos
  
  codes.forEach(code => {
    const numericCode = parseInt(code);
    if (isNaN(numericCode)) {
      console.log(`⚠️ Código no numérico ignorado: ${code}`);
      return;
    }

    let codeFound = false;
    
    files.forEach(file => {
      const fileName = path.parse(file).name;
      
      // Buscar todos los números en el nombre del archivo
      const numbersInFile = fileName.match(/\d+/g);
      
      if (numbersInFile) {
        const hasMatch = numbersInFile.some(fileNumber => {
          return parseInt(fileNumber) === numericCode;
        });
        
        if (hasMatch) {
          if (!matches.includes(file)) {
            matches.push(file);
          }
          foundCodes.add(numericCode);
          codeFound = true;
          
          // Mapear código a archivo
          if (!codeFilesMap[numericCode]) {
            codeFilesMap[numericCode] = [];
          }
          codeFilesMap[numericCode].push(file);
          
          console.log(`🎯 Coincidencia: código ${code} -> archivo ${file}`);
        }
      }
    });
  });

  // Encontrar códigos faltantes
  const missingCodes = codes
    .map(code => parseInt(code))
    .filter(code => !isNaN(code) && !foundCodes.has(code));

  return {
    matches,
    missingCodes,
    codeFilesMap,
    totalProcessed: codes.length,
    foundCount: foundCodes.size,
    missingCount: missingCodes.length
  };
};