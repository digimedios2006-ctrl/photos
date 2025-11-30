document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const processBtn = document.getElementById('processBtn');
    const resultDiv = document.getElementById('result');
    
    // Validaciones básicas
    const csvFile = document.getElementById('csvFile').files[0];
    const photosFolder = document.getElementById('photosFolder').value;
    const outputFolder = document.getElementById('outputFolder').value;
    
    if (!csvFile || !photosFolder || !outputFolder) {
        showResult('Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Mostrar loading
    processBtn.disabled = true;
    processBtn.textContent = 'Procesando... ⏳';
    resultDiv.style.display = 'none';
    
    try {
        const formData = new FormData(form);
        
        const response = await fetch('/process-photos', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        showResult(data.message, data.status, data.details);
        
    } catch (error) {
        console.error('Error:', error);
        showResult('Error de conexión: ' + error.message, 'error');
    } finally {
        processBtn.disabled = false;
        processBtn.textContent = '🚀 Procesar Fotos';
    }
});

function showResult(message, type, details = null) {
    const resultDiv = document.getElementById('result');
    
    resultDiv.className = `result-container result-${type}`;
    
    let detailsHTML = '';
    if (details) {
        detailsHTML = `
            <div class="result-details">
                <h4>📊 Resumen del Proceso:</h4>
                <ul>
                    <li>📋 Códigos en CSV: ${details.totalCodes}</li>
                    <li>🖼️ Fotos en carpeta: ${details.totalFiles}</li>
                    <li>✅ Coincidencias encontradas: ${details.matchesFound}</li>
                    <li>📤 Fotos movidas: ${details.movedFiles.length}</li>
                </ul>
        `;
        
        // Mostrar códigos faltantes si existen
        if (details.missingCodes && details.missingCodes.length > 0) {
            detailsHTML += `
                <div class="missing-codes-section" style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h5 style="color: #856404; margin-bottom: 10px;">⚠️ Códigos No Encontrados: ${details.missingCount}</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${details.missingCodes.map(code => 
                            `<span style="background: #856404; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.9em;">${code}</span>`
                        ).join('')}
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #856404;">
                    <strong>Posibles causas:</strong><br>
                    • El código no existe en nombres de archivo<br>
                    • Formato diferente en el nombre del archivo<br>
                    • El archivo no es una imagen compatible<br>
                    • Error de tipeo en el CSV
                    </p>
                </div>
            `;
        }
        
        // Mostrar errores de movimiento si existen
        if (details.errors && details.errors.length > 0) {
            detailsHTML += `
                <div style="margin-top: 15px;">
                    <h5>❌ Errores al mover archivos:</h5>
                    <ul style="background: #f8d7da; padding: 10px; border-radius: 5px;">
                        ${details.errors.map(error => `<li style="color: #721c24;">${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Mostrar mapeo de códigos a archivos (para debugging)
        if (details.codeFilesMap && Object.keys(details.codeFilesMap).length > 0) {
            detailsHTML += `
                <div style="margin-top: 15px;">
                    <h5>🔍 Coincidencias encontradas (para referencia):</h5>
                    <div style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                        ${Object.entries(details.codeFilesMap).map(([code, files]) => 
                            `<div style="margin-bottom: 5px;">
                                <strong>Código ${code}:</strong> ${files.join(', ')}
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        detailsHTML += `</div>`;
    }
    
    resultDiv.innerHTML = `
        <h3>${getStatusIcon(type)} ${getStatusTitle(type)}</h3>
        <p>${message}</p>
        ${detailsHTML}
    `;
    
    resultDiv.style.display = 'block';
    
    // Scroll automático a los resultados
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getStatusIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    };
    return icons[type] || 'ℹ️';
}

function getStatusTitle(type) {
    const titles = {
        'success': 'Proceso Completado',
        'error': 'Error en el Proceso',
        'warning': 'Proceso Completado con Advertencias'
    };
    return titles[type] || 'Información';
}

// Ejemplos de rutas para ayudar al usuario
document.getElementById('photosFolder').placeholder = "Ej: " + (
    window.navigator.platform.includes('Win') ? 
    'C:\\Usuarios\\TuNombre\\Fotos\\Evento' : 
    '/home/tunombre/fotos/evento'
);

document.getElementById('outputFolder').placeholder = "Ej: " + (
    window.navigator.platform.includes('Win') ? 
    'C:\\Usuarios\\TuNombre\\Fotos\\Seleccionadas' : 
    '/home/tunombre/fotos/seleccionadas'
);