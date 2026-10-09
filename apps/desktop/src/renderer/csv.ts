namespace Bunker {
  // Lê o CSV inteiro (RFC 4180): aspas duplas, vírgulas e quebras de linha dentro de campos, CRLF ou LF.
  // Devolve um objeto por linha, indexado pelo cabeçalho da primeira linha.
  export function parseFullCSV(text: string): CsvRow[] {
    const result: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        row.push(field);
        result.push(row);
        row = [];
        field = '';
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
      } else {
        field += char;
      }
      i++;
    }
    if (field || text[i - 1] === ',') row.push(field);
    if (row.length > 0) result.push(row);

    if (result.length === 0) return [];

    const headers = result[0].map(header => header.trim());
    const objects: CsvRow[] = [];
    for (let j = 1; j < result.length; j++) {
      const line = result[j];
      if (line.length === 1 && line[0].trim() === '') continue;
      const obj: CsvRow = {};
      for (let k = 0; k < headers.length; k++) {
        obj[headers[k]] = line[k] ? line[k].trim() : '';
      }
      objects.push(obj);
    }
    return objects;
  }
}
