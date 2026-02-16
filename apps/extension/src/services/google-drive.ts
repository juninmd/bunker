export class GoogleDriveService {
  private accessToken: string | null;

  constructor() {
    this.accessToken = null;
  }

  async authorize(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token: any) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // Handle potential object return or string
          const actualToken = (typeof token === 'object' && token !== null && 'token' in token) ? token.token : token;
          this.accessToken = actualToken || null;
          resolve(actualToken || '');
        }
      });
    });
  }

  async findFile(name: string): Promise<any> {
    if (!this.accessToken) await this.authorize();
    // Ensure we don't find trashed files
    const query = `name = '${name}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, modifiedTime)`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to find file: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    return data.files.length > 0 ? data.files[0] : null;
  }

  async createFile(name: string, content: string | Blob, mimeType: string): Promise<any> {
    if (!this.accessToken) await this.authorize();

    const metadata = {
      name,
      mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelim;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create file: ${response.status} ${errorText}`);
    }
    return await response.json();
  }

  async updateFile(fileId: string, content: string | Blob, mimeType: string): Promise<any> {
    if (!this.accessToken) await this.authorize();

    // Using uploadType=media for simple content update
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': mimeType,
      },
      body: content,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update file: ${response.status} ${errorText}`);
    }
    return await response.json();
  }

  async getFileContent(fileId: string): Promise<string> {
    if (!this.accessToken) await this.authorize();

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get file content: ${response.status} ${errorText}`);
    }
    return await response.text();
  }
}
