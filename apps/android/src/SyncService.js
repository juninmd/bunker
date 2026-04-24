import { parseCSV } from '../../extension/src/utils/csv-utils.js';

export class SyncService {
    /**
     * Obter o ID do arquivo passwords.csv no Google Drive
     */
    static async getFileId(token) {
        const q = encodeURIComponent('name="passwords.csv" and trashed=false');
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar arquivo no Drive');
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    }

    /**
     * Download passwords.csv from Google Drive
     */
    static async syncWithGoogleDrive(token) {
        try {
            console.log("Iniciando sincronização com Google Drive API...");
            if (!token) throw new Error("Token OAuth não fornecido.");

            const fileId = await this.getFileId(token);
            let csvText = '';

            if (fileId) {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao baixar CSV do Drive');
                csvText = await response.text();
            } else {
                csvText = 'url,username,password,extra,name,grouping,fav\n'; // Initial structure if not found
            }

            const parsed = parseCSV(csvText);
            const result = [];

            parsed.forEach(obj => {
                if (obj['grouping'] !== 'Deleted' && obj['url']) {
                    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(); // NOSONAR

                    result.push({
                        id: randomId,
                        title: obj['url'] || 'Unnamed',
                        username: obj['username'] || '',
                        password: obj['password'] || ''
                    });
                }
            });

            console.log("Sincronização com Google Drive concluída com sucesso.");
            return result;
        } catch (error) {
            console.error("Erro ao sincronizar com Google Drive:", error);
            throw error;
        }
    }

    /**
     * Salvar/Enviar dados para o passwords.csv no Google Drive
     */
    static async uploadToDrive(csvData, token) {
        try {
            console.log("Iniciando upload para o Google Drive API...");
            if (!token) throw new Error("Token OAuth não fornecido.");

            let fileId = await this.getFileId(token);

            if (!fileId) {
                // Step 1: Create empty file metadata
                const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: 'passwords.csv', mimeType: 'text/csv' })
                });
                if (!createRes.ok) throw new Error('Falha ao criar o arquivo no Drive');
                const createdData = await createRes.json();
                fileId = createdData.id;
            }

            // Step 2: Upload content via media upload
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/csv'
                },
                body: csvData
            });

            if (!response.ok) throw new Error('Falha ao fazer upload de media para o Drive');
            console.log("Upload para o Google Drive concluído com sucesso.");
            return await response.json();
        } catch (error) {
            console.error("Erro ao fazer upload para o Google Drive:", error);
            throw error;
        }
    }
}
