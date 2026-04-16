export class SyncService {
    /**
     * Parses CSV content into an array of arrays (lines of fields).
     * Handles quoted fields and newlines within fields.
     * @param {string} str
     * @returns {Array<Array<string>>}
     */
    static parseCSVLines(str) {
        const arr = [];
        let quote = false;
        let row = [];
        let col = '';

        str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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

    /**
     * Parse the standard LastPass-compatible BunkerPass CSV format using robust RFC 4180 parsing.
     */
    static parseCSV(text) {
        if (!text) return [];
        const lines = this.parseCSVLines(text);
        if (lines.length < 2) return [];

        const headerRow = lines[0];
        if (!headerRow) return [];

        const headers = headerRow.map(h => h.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i];
            if (!currentLine) continue;
            // Skip empty lines
            if (currentLine.length === 0 || (currentLine.length === 1 && currentLine[0] === '')) continue;

            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = currentLine[index] !== undefined ? currentLine[index] : '';
            });

            // Ignore tombstoned deletes
            if (obj['grouping'] !== 'Deleted') {
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
     * Download passwords.csv from Google Drive
     */
    static async syncWithGoogleDrive() {
        return new Promise((resolve) => {
            // Simulando fetch de uma API real do Google Drive
            setTimeout(() => {
                const mockCSV = 'url,username,password,extra,name,grouping,fav\ngoogle.com,test@gmail.com,***,,,,\ngithub.com,dev_user,***,,,,\nbank.com,admin_user,***,,,Deleted,\npasskey.com,user,,Passkey Exemplo,,,\n"complex,site.com",user,"p,a""ss",note,,,\n';
                const parsed = this.parseCSV(mockCSV);
                resolve(parsed);
            }, 1000);
        });
    }
}
