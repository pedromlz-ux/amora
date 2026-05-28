const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'documentos_treinamento');

function flatten(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Recursively flatten contents of subdirectory
            flatten(fullPath);
            // Move any remaining files (if any) and then remove directory
            const subItems = fs.readdirSync(fullPath);
            for (const subItem of subItems) {
                const subFullPath = path.join(fullPath, subItem);
                const destPath = path.join(DOCS_DIR, subItem);
                
                // Handle duplicate file names gracefully by appending timestamp if needed
                let finalDest = destPath;
                if (fs.existsSync(finalDest)) {
                    const ext = path.extname(subItem);
                    const name = path.basename(subItem, ext);
                    finalDest = path.join(DOCS_DIR, `${name}_${Date.now()}${ext}`);
                }
                
                fs.renameSync(subFullPath, finalDest);
                console.log(`Movido: ${subItem} -> ${path.basename(finalDest)}`);
            }
            fs.rmdirSync(fullPath);
            console.log(`Removido diretório vazio: ${item}`);
        } else {
            // If it is in a subdirectory, move it to the root
            if (dir !== DOCS_DIR) {
                const destPath = path.join(DOCS_DIR, item);
                let finalDest = destPath;
                if (fs.existsSync(finalDest)) {
                    const ext = path.extname(item);
                    const name = path.basename(item, ext);
                    finalDest = path.join(DOCS_DIR, `${name}_${Date.now()}${ext}`);
                }
                fs.renameSync(fullPath, finalDest);
                console.log(`Movido para raiz: ${item} -> ${path.basename(finalDest)}`);
            }
        }
    }
}

console.log("Iniciando achatamento da pasta de documentos...");
flatten(DOCS_DIR);
console.log("Pasta de documentos achatada com sucesso!");
