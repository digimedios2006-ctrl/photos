const pathHistory = {
    get: (key) => {
        try {
            return localStorage.getItem(`last_${key}_path`);
        } catch (e) {
            return null;
        }
    },
    set: (key, path) => {
        try {
            localStorage.setItem(`last_${key}_path`, path);
        } catch (e) {
            console.warn('No se pudo guardar la ruta en el historial');
        }
    }
};

class FolderSelector {
    constructor(inputId, buttonId, storageKey) {
        this.input = document.getElementById(inputId);
        this.button = document.getElementById(buttonId);
        this.storageKey = storageKey;
        
        this.init();
    }
    
    init() {
        // Reestructurar el DOM para el nuevo layout
        this.restructureDOM();
        
        this.input.readOnly = false;
        this.input.placeholder = this.getPlaceholder();
        
        const savedPath = pathHistory.get(this.storageKey);
        if (savedPath) {
            this.input.value = savedPath;
            this.updatePathDisplay();
        }
        
        this.input.addEventListener('input', () => {
            this.updatePathDisplay();
            pathHistory.set(this.storageKey, this.input.value);
        });
        
        this.button.addEventListener('click', () => this.showHelp());
    }
    
    restructureDOM() {
        const container = this.input.parentNode;
        
        // Crear nueva estructura
        const wrapper = document.createElement('div');
        wrapper.className = 'folder-input-wrapper';
        
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'folder-messages';
        
        // Mover elementos a la nueva estructura
        container.appendChild(wrapper);
        wrapper.appendChild(this.input);
        wrapper.appendChild(this.button);
        container.appendChild(messagesContainer);
        
        // Agregar mensaje de información del navegador
        this.addBrowserInfo(messagesContainer);
    }
    
    addBrowserInfo(container) {
        const infoMessage = document.createElement('div');
        infoMessage.className = 'browser-info';
        infoMessage.innerHTML = `
            <strong>💡 Información Importante:</strong> 
            Por razones de seguridad del navegador, debes ingresar manualmente las <strong>rutas absolutas</strong> de las carpetas.
            <br><strong>Ejemplo en Windows:</strong> C:\\Users\\TuNombre\\Fotos\\Evento
            <br><strong>Ejemplo en Linux/Mac:</strong> /home/tunombre/fotos/evento
        `;
        container.appendChild(infoMessage);
    }
    
    getPlaceholder() {
        if (window.navigator.platform.includes('Win')) {
            return 'Ej: C:\\Usuarios\\TuNombre\\Fotos\\Evento';
        } else {
            return 'Ej: /home/tunombre/fotos/evento';
        }
    }
    
    showHelp() {
        alert(`💡 Para seleccionar una carpeta:\n\n1. Abre el Explorador de Archivos\n2. Navega a la carpeta deseada\n3. Copia la ruta completa desde la barra de dirección\n4. Pégala en este campo\n\n🖥️ Windows: Presiona Ctrl+L en el Explorador para copiar la ruta\n🍎 Mac: Cmd+Shift+G en Finder para ir a una carpeta\n🐧 Linux: Ctrl+L en la mayoría de gestores de archivos`);
    }
    
    updatePathDisplay() {
        const path = this.input.value;
        const displayElement = this.getOrCreateDisplayElement();
        
        if (path) {
            const isAbsolute = path.startsWith('/') || /^[a-zA-Z]:\\/.test(path);
            
            if (isAbsolute) {
                displayElement.innerHTML = `✅ <strong>Ruta absoluta detectada:</strong><br>${path}`;
                displayElement.style.background = 'rgba(16, 185, 129, 0.1)';
                displayElement.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                displayElement.style.color = 'var(--success)';
                displayElement.style.borderLeft = '4px solid var(--success)';
            } else {
                displayElement.innerHTML = `⚠️ <strong>Ruta relativa:</strong> ${path}<br><small>Se recomienda usar ruta absoluta para mejor resultado</small>`;
                displayElement.style.background = 'rgba(245, 158, 11, 0.1)';
                displayElement.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                displayElement.style.color = 'var(--warning)';
                displayElement.style.borderLeft = '4px solid var(--warning)';
            }
            displayElement.classList.add('show');
        } else {
            displayElement.classList.remove('show');
        }
    }
    
    getOrCreateDisplayElement() {
        const container = this.input.closest('.folder-input-container');
        let displayElement = container.querySelector('.path-display');
        if (!displayElement) {
            displayElement = document.createElement('div');
            displayElement.className = 'path-display';
            const messagesContainer = container.querySelector('.folder-messages');
            // Insertar antes del browser-info
            messagesContainer.insertBefore(displayElement, messagesContainer.firstChild);
        }
        return displayElement;
    }
    
    getSelectedPath() {
        return this.input.value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupFileInput();
    const photosFolderSelector = new FolderSelector('photosFolder', 'selectPhotosFolder', 'photos');
    const outputFolderSelector = new FolderSelector('outputFolder', 'selectOutputFolder', 'output');
    
    const form = document.getElementById('photoForm');
    const processBtn = document.getElementById('processBtn');
    const resultDiv = document.getElementById('result');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const csvFile = document.getElementById('csvFile').files[0];
        const photosFolder = photosFolderSelector.getSelectedPath();
        const outputFolder = outputFolderSelector.getSelectedPath();
        
        if (!csvFile) {
            showResult('Por favor, selecciona un archivo CSV', 'error');
            return;
        }
        
        if (!photosFolder) {
            showResult('Por favor, ingresa la ruta de la carpeta donde están las fotos', 'error');
            return;
        }
        
        if (!outputFolder) {
            showResult('Por favor, ingresa la ruta de la carpeta destino', 'error');
            return;
        }
        
        if (photosFolder === outputFolder) {
            showResult('La carpeta de origen y destino no pueden ser la misma', 'error');
            return;
        }
        
        const absolutePathRegex = /^(\/|\\|[a-zA-Z]:)/;
        if (!absolutePathRegex.test(photosFolder)) {
            showResult('La ruta de origen no parece ser una ruta absoluta. Por favor, usa rutas completas.', 'error');
            return;
        }
        
        if (!absolutePathRegex.test(outputFolder)) {
            showResult('La ruta de destino no parece ser una ruta absoluta. Por favor, usa rutas completas.', 'error');
            return;
        }
        
        processBtn.disabled = true;
        processBtn.textContent = 'Procesando... ⏳';
        resultDiv.style.display = 'none';
        
        try {
            const formData = new FormData();
            formData.append('csvFile', csvFile);
            formData.append('photosFolder', photosFolder);
            formData.append('outputFolder', outputFolder);
            
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
        
        if (details.missingCodes && details.missingCodes.length > 0) {
            detailsHTML += `
                <div class="missing-codes-section">
                    <h5>⚠️ Códigos No Encontrados: ${details.missingCount}</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${details.missingCodes.map(code => 
                            `<span class="code-pill">${code}</span>`
                        ).join('')}
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                    <strong>Posibles causas:</strong><br>
                    • El código no existe en nombres de archivo<br>
                    • Formato diferente en el nombre del archivo<br>
                    • El archivo no es una imagen compatible<br>
                    • Error de tipeo en el CSV
                    </p>
                </div>
            `;
        }
        
        if (details.errors && details.errors.length > 0) {
            detailsHTML += `
                <div style="margin-top: 15px;">
                    <h5>❌ Errores al mover archivos:</h5>
                    <ul style="background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 5px;">
                        ${details.errors.map(error => `<li style="color: var(--error);">${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (details.codeFilesMap && Object.keys(details.codeFilesMap).length > 0) {
            detailsHTML += `
                <div style="margin-top: 15px;">
                    <h5>🔍 Coincidencias encontradas (para referencia):</h5>
                    <div style="max-height: 200px; overflow-y: auto; background: var(--surface); padding: 10px; border-radius: 5px;">
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

function setupFileInput() {
    const csvFileInput = document.getElementById('csvFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    
    csvFileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            const fileName = this.files[0].name;
            fileNameDisplay.textContent = `📄 Archivo seleccionado: ${fileName}`;
            fileNameDisplay.classList.add('show');
        } else {
            fileNameDisplay.classList.remove('show');
        }
    });
}