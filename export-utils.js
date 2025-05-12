// Export HTML table to Excel file with professional styling, excluding last column (Actions)
window.exportTableToExcel = function(tableId, filename = '', excludeLastColumn = true) {
  const table = document.getElementById(tableId);
  if (!table) {
    alert('Table not found!');
    return;
  }

  // Extract headers from thead, excluding last column if needed
  const headerCells = table.querySelectorAll('thead tr th');
  const headers = [];
  for (let i = 0; i < headerCells.length; i++) {
    if (excludeLastColumn && i === headerCells.length - 1) continue;
    headers.push(headerCells[i].innerText.trim());
  }

  // Extract data from rows currently in tbody, excluding rows with class 'hidden' or 'd-none'
  const data = [];
  const tbody = table.tBodies[0];
  if (!tbody) {
    alert('Table body not found!');
    return;
  }
  const rows = Array.from(tbody.rows).filter(row => {
    const style = window.getComputedStyle(row);
    return style.display !== 'none' && style.visibility !== 'hidden' && !row.classList.contains('hidden') && !row.classList.contains('d-none');
  });

  rows.forEach((row, rowIndex) => {
    const rowData = [];
    const cells = Array.from(row.cells);
    const length = excludeLastColumn ? cells.length - 1 : cells.length;
    for (let i = 0; i < length; i++) {
      if (i === 0) {
        // Replace serial number with rowIndex + 1
        rowData.push((rowIndex + 1).toString());
      } else {
        rowData.push(cells[i].innerText.trim());
      }
    }
    data.push(rowData);
  });

  if (data.length === 0) {
    alert('No visible data to export!');
    return;
  }

  // Prepend headers to data array
  data.unshift(headers);

  // Create worksheet from data array
  let worksheet = XLSX.utils.aoa_to_sheet(data);

  // Apply styling: bold font for header row, header fill color, borders, alternating row colors
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r:R, c:C});
      if (!worksheet[cellAddress]) continue;
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
      // Header row styling
      if (R === 0) {
        worksheet[cellAddress].s.font = { bold: true, color: { rgb: "FFFFFFFF" } };
        worksheet[cellAddress].s.fill = { patternType: "solid", fgColor: { rgb: "808080" } };
        worksheet[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
        worksheet[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        };
      } else {
        // Body row styling with alternating row colors
        worksheet[cellAddress].s.fill = (R % 2 === 0) ? { patternType: "solid", fgColor: { rgb: "F3F6FF" } } : {};
        worksheet[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
        worksheet[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        };
      }
    }
  }

  // Set column widths based on max length in each column
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLength = 10; // minimum width
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({r:R, c:C});
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const length = cell.v.toString().length;
        if (length > maxLength) maxLength = length;
      }
    }
    colWidths.push({ wch: maxLength + 2 });
  }
  worksheet['!cols'] = colWidths;

  // Add autofilter to header row
  worksheet['!autofilter'] = { ref: worksheet['!ref'] };

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Create a new Workbook
  let workbook = XLSX.utils.book_new();

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename ? filename + ".xlsx" : "exported_table.xlsx");
};

// New function to export visible table rows to PDF
// Updated exportTableToPDF to ensure autotable plugin is registered and used correctly
window.exportTableToPDF = function(tableId, filename = '', excludeLastColumn = true) {
  const table = document.getElementById(tableId);
  if (!table) {
    alert('Table not found!');
    return;
  }

  // Extract headers from thead, excluding last column if needed
  const headerCells = table.querySelectorAll('thead tr th');
  const headers = [];
  for (let i = 0; i < headerCells.length; i++) {
    if (excludeLastColumn && i === headerCells.length - 1) continue;
    headers.push(headerCells[i].innerText.trim());
  }

  // Extract data from rows currently in tbody, excluding rows with class 'hidden' or 'd-none'
  const data = [];
  const tbody = table.tBodies[0];
  if (!tbody) {
    alert('Table body not found!');
    return;
  }
  const rows = Array.from(tbody.rows).filter(row => {
    const style = window.getComputedStyle(row);
    return style.display !== 'none' && style.visibility !== 'hidden' && !row.classList.contains('hidden') && !row.classList.contains('d-none');
  });

  rows.forEach((row, rowIndex) => {
    const rowData = [];
    const cells = Array.from(row.cells);
    const length = excludeLastColumn ? cells.length - 1 : cells.length;
    for (let i = 0; i < length; i++) {
      if (i === 0) {
        // Replace serial number with rowIndex + 1
        rowData.push((rowIndex + 1).toString());
      } else {
        rowData.push(cells[i].innerText.trim());
      }
    }
    data.push(rowData);
  });

  if (data.length === 0) {
    alert('No visible data to export!');
    return;
  }

  // Use jsPDF and autotable to generate PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Register autotable plugin if needed (usually auto-registered by script tag)
  if (typeof doc.autoTable !== 'function') {
    alert('jsPDF autotable plugin is not loaded.');
    return;
  }

  doc.autoTable({
    head: [headers],
    body: data,
    styles: { halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [128, 128, 128], textColor: 255, fontStyle: 'bold' },
    startY: 20,
  });

  doc.save(filename ? filename + '.pdf' : 'exported_table.pdf');
};
