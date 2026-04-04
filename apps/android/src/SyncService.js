export class SyncService {
    /**
     * Parse the standard LastPass-compatible BunkerPass CSV format
     */
    static parseCSV(text) {
        const lines = text.split('\n');
        const result = [];
        if (lines.length === 0) return result;

        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Simple split handling, assumes no commas in values for MVP
            const currentline = lines[i].split(',');
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
            }
            // Ignore tombstoned deletes
            if (obj['grouping'] !== 'Deleted') {
                // Generate a pseudo-random ID securely or fallback for React Native
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
        }
        return result;
    }

    /**
     * Parse full CSV conforming to RFC 4180 (handles quotes and newlines)
     */
    static parseFullCSV(text) {
        const arr = [];
        let quote = false;
        let row = [];
        let col = '';
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        for (let cIndex = 0; cIndex < text.length; cIndex++) {
            let c = text[cIndex];
            let cc = text[cIndex + 1];

            if (c === '"') {
                if (quote && cc === '"') {
                    col += '"';
                    cIndex++;
                } else {
                    quote = !quote;
                }
            } else if (c === ',' && !quote) {
                row.push(col);
                col = '';
            } else if (c === '\n' && !quote) {
                row.push(col);
                col = '';
                arr.push(row);
                row = [];
            } else {
                col += c;
            }
        }
        if (col.length > 0 || row.length > 0) {
            row.push(col);
            arr.push(row);
        }

        const headers = arr[0] || [];
        const result = [];
        for (let i = 1; i < arr.length; i++) {
            const currentLine = arr[i];
            if (!currentLine || currentLine.length === 0 || (currentLine.length === 1 && currentLine[0] === '')) continue;
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j].trim()] = currentLine[j] !== undefined ? currentLine[j] : '';
            }
            if (obj['grouping'] !== 'Deleted') {
                 result.push({
                     id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                     title: obj['url'] || 'Unnamed',
                     username: obj['username'] || '',
                     password: obj['password'] || '',
                     extra: obj['extra'] || ''
                 });
            }
        }
        return result;
    }

    /**
     * Download passwords.csv from Google Drive
     */
    static async syncWithGoogleDrive() {
        return new Promise((resolve) => {
            // Simulando fetch de uma API real do Google Drive que lida com CSV assinado
            setTimeout(() => {
                const mockCSV = 'url,username,password,extra,name,grouping,fav\n"google.com",test@gmail.com,pass123,,,,\n"github.com",dev_user,gitpass123,,,,\nbank.com,admin_user,supersecret,,,Deleted,\npasskey.com,user,,Passkey Exemplo,,,\n"facebook.com",user2,"p,a,s,s",,,,\n';
                const parsed = this.parseFullCSV(mockCSV);
                resolve(parsed);
            }, 1000);
        });
    }
}
