const QUOTE = '"';
const COMMA = ',';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const endField = (): void => {
    row.push(field);
    field = '';
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === QUOTE) {
        if (text[i + 1] === QUOTE) {
          field += QUOTE;
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === QUOTE) {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === COMMA) {
      endField();
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    endRow();
  }

  return rows;
}

function needsQuoting(field: string): boolean {
  return (
    field.includes(COMMA) ||
    field.includes(QUOTE) ||
    field.includes('\n') ||
    field.includes('\r')
  );
}

function quoteField(field: string): string {
  return needsQuoting(field)
    ? `${QUOTE}${field.split(QUOTE).join(QUOTE + QUOTE)}${QUOTE}`
    : field;
}

export function stringifyCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(quoteField).join(COMMA)).join('\n');
}
