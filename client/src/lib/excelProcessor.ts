import * as XLSX from 'xlsx';

export interface ExcelRowData {
  Municipality: string;
  State: string;
  Crop: string;
  Year: number;
  Hectares: number;
  Production?: number;
  IBGECode?: string;
  Latitude?: number;
  Longitude?: number;
  Category?: string;
  Color?: string;
}

export function processExcelFile(file: File): Promise<ExcelRowData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const processedData: ExcelRowData[] = jsonData.map(row => ({
          Municipality: row.Municipality || row.Municipio || '',
          State: row.State || row.Estado || '',
          Crop: row.Crop || row.Cultura || '',
          Year: parseInt(row.Year || row.Ano || '2023'),
          Hectares: parseFloat(row.Hectares || row.Hectares || '0'),
          Production: row.Production || row.Producao ? parseFloat(row.Production || row.Producao) : undefined,
          IBGECode: row.IBGECode || row.CodigoIBGE || undefined,
          Latitude: row.Latitude || row.Latitude ? parseFloat(row.Latitude || row.Latitude) : undefined,
          Longitude: row.Longitude || row.Longitude ? parseFloat(row.Longitude || row.Longitude) : undefined,
          Category: row.Category || row.Categoria || 'Temporária',
          Color: row.Color || row.Cor || '#7CB342',
        }));
        
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data: any[], filename: string = 'export.xlsx'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Save the file
  XLSX.writeFile(workbook, filename);
}

export function validateExcelData(data: ExcelRowData[]): { valid: ExcelRowData[]; errors: string[] } {
  const valid: ExcelRowData[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    if (!row.Municipality) {
      rowErrors.push(`Row ${index + 1}: Municipality is required`);
    }
    
    if (!row.State) {
      rowErrors.push(`Row ${index + 1}: State is required`);
    }
    
    if (!row.Crop) {
      rowErrors.push(`Row ${index + 1}: Crop is required`);
    }
    
    if (!row.Year || row.Year < 1900 || row.Year > new Date().getFullYear()) {
      rowErrors.push(`Row ${index + 1}: Valid year is required`);
    }
    
    if (!row.Hectares || row.Hectares < 0) {
      rowErrors.push(`Row ${index + 1}: Valid hectares value is required`);
    }
    
    if (rowErrors.length === 0) {
      valid.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });
  
  return { valid, errors };
}
