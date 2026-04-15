export class SyncService {
    /**
     * Parse the standard LastPass-compatible BunkerPass CSV format
     */
    static parseCSVLines(str) {
        const arr = [];
        let quote = false;
        let row = [];
        let col = '';

        str = str.replace(/\r\n|\r/g, '\n');

        for (let cIndex = 0; cIndex < str.length; cIndex++) {
            let c = str[cIndex];
            let cc = str[cIndex + 1];

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

        return arr;
    }

    static parseCSV(text) {
        const result = [];
        const lines = this.parseCSVLines(text);
        if (lines.length < 2) return result;

        const headerRow = lines[0];
        if (!headerRow) return result;

        const headers = headerRow.map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i];
            if (!currentLine) continue;
            if (currentLine.length === 0 || (currentLine.length === 1 && currentLine[0] === '')) continue;

            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = currentLine[index] !== undefined ? currentLine[index] : '';
            });

            if (obj['grouping'] !== 'Deleted') {
                const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(); // NOSONAR
                result.push({
                    id: randomId,
                    title: obj['url'] || obj['site'] || obj['name'] || 'Unnamed',
                    username: obj['username'] || '',
                    password: obj['password'] || ''
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
            // Simulando fetch de uma API real do Google Drive
            setTimeout(() => {
                const mockCSV = "url,username,password,extra,name,grouping,fav\ngoogle.com,test@gmail.com,***,,,,\ngithub.com,dev_user,***,,,,\nbank.com,admin_user,***,,,Deleted,\npasskey.com,user,,Passkey Exemplo,,,\n";
                const parsed = this.parseCSV(mockCSV);
                resolve(parsed);
            }, 1000);
        });
    }
}
