import React, { useRef } from 'react';
import { parseExcelFile } from './excelUtils';

const BulkStudentUpload = ({ onStudentsParsed }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      parseExcelFile(file, (rows) => {
        // Assume first row is header
        const [header, ...dataRows] = rows;
        const students = dataRows.map(row => {
          const student = {};
          header.forEach((key, idx) => {
            student[key] = row[idx];
          });
          return student;
        });
        onStudentsParsed(students);
      });
    } else {
      alert('Please upload an Excel (.xlsx or .xls) file.');
    }
  };

  return (
    <div style={{ margin: '16px 0' }}>
      <label style={{ fontWeight: 600 }}>Bulk Enroll Students (Excel): </label>
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ marginLeft: 8 }}
      />
    </div>
  );
};

export default BulkStudentUpload;
