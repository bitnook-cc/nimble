import { PDFDocument } from 'pdf-lib';

/**
 * Utility to inspect PDF form fields
 * This helps us understand what field names are available in the form-fillable PDF
 */
export async function inspectPDFFields(): Promise<string[]> {
  try {
    // Load the template PDF
    const response = await fetch('/character-sheet-template.pdf');
    const pdfBytes = await response.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    const fields = form.getFields();
    const fieldInfo: string[] = [];
    
    fields.forEach((field) => {
      const name = field.getName();
      const type = field.constructor.name;
      fieldInfo.push(`${name} (${type})`);
    });
    
    console.log('PDF Form Fields:', fieldInfo);
    return fieldInfo;
  } catch (error) {
    console.error('Error inspecting PDF fields:', error);
    return [];
  }
}

/**
 * Get specific field types for easier mapping
 */
export async function getPDFFieldNames(): Promise<{
  textFields: string[];
  checkboxFields: string[];
  dropdownFields: string[];
}> {
  try {
    const response = await fetch('/character-sheet-template.pdf');
    const pdfBytes = await response.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    const textFields: string[] = [];
    const checkboxFields: string[] = [];
    const dropdownFields: string[] = [];
    
    form.getFields().forEach((field) => {
      const name = field.getName();
      const type = field.constructor.name;
      
      if (type.includes('Text')) {
        textFields.push(name);
      } else if (type.includes('CheckBox')) {
        checkboxFields.push(name);
      } else if (type.includes('Dropdown')) {
        dropdownFields.push(name);
      }
    });
    
    return { textFields, checkboxFields, dropdownFields };
  } catch (error) {
    console.error('Error getting PDF field names:', error);
    return { textFields: [], checkboxFields: [], dropdownFields: [] };
  }
}