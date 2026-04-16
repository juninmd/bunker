import { parseCSV } from '../../extension/src/utils/csv-utils.js';

export class SyncService {
    /**
     * Download passwords.csv from Google Drive
     */
    static async syncWithGoogleDrive() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockCSV = 'url,username,password,extra,name,grouping,fav\ngoogle.com,test@gmail.com,***,,,,\ngithub.com,dev_user,***,,,,\nbank.com,admin_user,***,,,Deleted,\npasskey.com,user,,Passkey Exemplo,,,\n"complex,site.com",user,"p,a""ss",note,,,\n';

                const parsed = parseCSV(mockCSV);
                const result = [];

                parsed.forEach(obj => {
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
                });

                resolve(result);
            }, 1000);
        });
    }
}
