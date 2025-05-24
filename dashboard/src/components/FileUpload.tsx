'use client';

import { useState, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setError(null);
        onFileUpload(file);
      } else {
        setSelectedFile(null);
        setError('CSVまたはExcelファイルを選択してください。');
      }
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">
        ファイルを選択 (CSV or Excel):
      </label>
      <input
        id="fileInput"
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
      />
      {selectedFile && (
        <p className="mt-2 text-sm text-green-600">
          選択されたファイル: {selectedFile.name}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}