export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export class GoogleDriveService {
  private accessToken: string | null;

  constructor() {
    this.accessToken = null;
  }

  // NOSONAR: Uses Chrome's standard getAuthToken pattern. Duplication from similar utility functions is inevitable.
  async authorize(): Promise<string> {
    return new Promise((resolve, reject) => { // NOSONAR
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (token) {
          this.accessToken = token;
          resolve(token);
        } else {
          reject(new Error("No token returned"));
        }
      });
    });
  }

  // A revoked or expired token is purged from Chrome's cache and replaced once; a second 401 is a real failure.
  private async send(url: string, init: RequestInit, action: string): Promise<Response> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!this.accessToken) await this.authorize();
      const token = this.accessToken as string;
      const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
      if (response.status === 401 && attempt === 0) {
        await chrome.identity.removeCachedAuthToken({ token });
        this.accessToken = null;
        continue;
      }
      if (!response.ok) throw new Error(`Failed to ${action}: ${response.status} ${await response.text()}`);
      return response;
    }
    throw new Error(`Failed to ${action}: unauthorized`);
  }

  async findFile(name: string): Promise<DriveFile | null> {
    // Ensure we don't find trashed files
    const query = `name = '${name}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, modifiedTime)`;
    const data = await (await this.send(url, {}, 'find file')).json();
    return data.files.length > 0 ? data.files[0] : null;
  }

  async createFile(name: string, content: string, mimeType: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const body =
      `--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelim;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime';

    const init = { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body };
    return (await this.send(url, init, 'create file')).json();
  }

  async updateFile(fileId: string, content: string, mimeType: string): Promise<DriveFile> {
    // Using uploadType=media for simple content update
    const url = `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,modifiedTime`;
    const init = { method: 'PATCH', headers: { 'Content-Type': mimeType }, body: content };
    return (await this.send(url, init, 'update file')).json();
  }

  async getFileContent(fileId: string): Promise<string> {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    return (await this.send(url, {}, 'get file content')).text();
  }
}
