/**
 * Escapes a CSV field.
 * Encloses in quotes if it contains comma, quote, or newline.
 * Escapes quotes by doubling them.
 * @param {string} field
 * @returns {string}
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * Generates a CSV string from an array of objects.
 * @param {Array<Object>} data - The data to convert.
 * @param {Array<string>} headers - The headers to include in the CSV.
 * @returns {string} The CSV content.
 */
export function generateCSV(data, headers) {
  const headerRow = headers.map(escapeCSVField).join(',');
  const rows = data.map(row => {
    return headers.map(header => {
      return escapeCSVField(row[header]);
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * Parses CSV content into an array of arrays (lines of fields).
 * Handles quoted fields and newlines within fields.
 * @param {string} str
 * @returns {Array<Array<string>>}
 */
function parseCSVLines(str) {
    const arr = [];
    let quote = false;
    let row = [];
    let col = '';
    let c = '';

    for (let cIndex = 0; cIndex < str.length; cIndex++) {
        c = str[cIndex];
        let cc = str[cIndex + 1];

        if (c === '"') {
            if (quote && cc === '"') { // escaped quote
                col += '"';
                cIndex++;
            } else {
                quote = !quote;
            }
        } else if (c === ',' && !quote) {
            row.push(col);
            col = '';
        } else if ((c === '\r' || c === '\n') && !quote) {
             if (c === '\r' && cc === '\n') {
                 cIndex++;
             }
             row.push(col);
             col = '';
             arr.push(row);
             row = [];
        } else {
            col += c;
        }
    }

    if (row.length > 0 || col.length > 0) {
        row.push(col);
        arr.push(row);
    }

    return arr;
}

/**
 * Parses a CSV string into an array of objects.
 * Assumes the first row is the header.
 * @param {string} content
 * @returns {Array<Object>}
 */
export function parseCSV(content) {
  const lines = parseCSVLines(content);
  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (currentLine.length === 0 || (currentLine.length === 1 && currentLine[0] === '')) continue;

    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = currentLine[index] !== undefined ? currentLine[index] : '';
    });
    result.push(obj);
  }
  return result;
}
