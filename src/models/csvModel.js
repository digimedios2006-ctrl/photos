const fs = require('fs');
const csv = require('csv-parser');

exports.readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const codes = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Buscar la columna que contiene los códigos
        const code = row.codigo || row.code || row.Codigo || row.CODE || row[Object.keys(row)[0]];
        if (code && code.trim() !== '') {
          codes.push(code.trim());
        }
      })
      .on('end', () => {
        console.log('📊 Códigos leídos del CSV:', codes);
        resolve(codes);
      })
      .on('error', (error) => {
        reject(new Error('Error leyendo el archivo CSV: ' + error.message));
      });
  });
};