import * as XLSX from "xlsx";

export const exportData = (data, fileName, format) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const exportFileName = fileName || "exported_data";

  switch (format) {
    case "csv":
      exportToCSV(data, exportFileName);
      break;
    case "excel":
      exportToExcel(data, exportFileName);
      break;
    case "json":
      exportToJSON(data, exportFileName);
      break;
    default:
      alert("Invalid export format selected.");
  }
};

// Convert data to CSV format
const exportToCSV = (data, fileName) => {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(",")).join("\n");
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Convert data to Excel format
const exportToExcel = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Convert data to JSON format
const exportToJSON = (data, fileName) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
