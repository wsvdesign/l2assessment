/**
 * Export and Import utilities for analysis data
 */

export function exportToCSV(history) {
  if (!history || history.length === 0) {
    alert('No history to export');
    return;
  }

  const headers = [
    'Date',
    'Message',
    'Category',
    'Secondary Category',
    'Confidence',
    'Urgency',
    'Recommended Action',
    'Reasoning'
  ];

  const rows = history.map((item) => [
    new Date(item.timestamp).toLocaleString(),
    `"${(item.message || '').replace(/"/g, '""')}"`,
    item.category || '',
    item.secondaryCategory || '',
    typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : '',
    item.urgency || '',
    `"${(item.recommendedAction || '').replace(/"/g, '""')}"`,
    `"${(item.reasoning || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\n');

  downloadFile(csvContent, 'triage-history.csv', 'text/csv');
}

export function exportToJSON(history) {
  if (!history || history.length === 0) {
    alert('No history to export');
    return;
  }

  const jsonContent = JSON.stringify(history, null, 2);
  downloadFile(jsonContent, 'triage-history.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }

        const messages = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);

          if (values.length >= 2) {
            messages.push({
              message: values[1] || '',
              category: values[2] || 'Unknown',
              secondaryCategory: values[3] || null,
              confidence: parseFloat(values[4]) / 100 || 0.5,
              urgency: values[5] || 'Medium',
              recommendedAction: values[6] || '',
              reasoning: values[7] || '',
              timestamp: new Date(values[0] || new Date()).toISOString(),
              isBulkImport: true
            });
          }
        }

        resolve(messages);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}
