'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import DataChart from '@/components/DataChart'; // DataChartコンポーネントをインポート

// データ型を定義 (必要に応じて調整)
type DataRow = { [key: string]: string | number };

export default function Home() {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    setError(null);
    setData([]);

    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse<DataRow>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<DataRow>) => {
            setData(results.data);
            setIsLoading(false);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: (err: any) => {
            const message = err.message || 'CSVパース中に不明なエラーが発生しました。';
            setError(`CSVパースエラー: ${message}`);
            setIsLoading(false);
          },
        });
      } else if (file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          try {
            const arrayBuffer = e.target?.result;
            if (arrayBuffer && (typeof arrayBuffer === 'string' || arrayBuffer instanceof ArrayBuffer)) {
              const workbook = XLSX.read(arrayBuffer, { type: 'array' }); // ESLint disableを削除 (不要なため)
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

              if (jsonData.length > 0) {
                const headers = jsonData[0].map(String); // ヘッダーを文字列に変換
                const parsedData = jsonData.slice(1).map((row) => {
                  const rowData: DataRow = {};
                  headers.forEach((header, index) => {
                    rowData[header] = row[index];
                  });
                  return rowData;
                });
                setData(parsedData);
              } else {
                setData([]);
              }
            }
            setIsLoading(false);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (parseError: any) {
            const message = parseError.message || 'Excelパース中に不明なエラーが発生しました。';
            setError(`Excelパースエラー: ${message}`);
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError('ファイル読み込みエラー');
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError('サポートされていないファイル形式です。CSVまたはExcelファイルを選択してください。');
        setIsLoading(false);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.message || '処理中に不明なエラーが発生しました。';
      setError(`処理エラー: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            データ可視化ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">
            CSVまたはExcelファイルをアップロードしてデータをグラフ化します。
          </p>
        </header>

        <FileUpload onFileUpload={handleFileUpload} />

        {isLoading && (
          <div className="mt-6 text-center text-blue-600">
            <p>データを読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
            <p className="font-semibold">エラー:</p>
            <p>{error}</p>
          </div>
        )}

        {fileName && !isLoading && !error && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              読み込みデータ: {fileName}
            </h2>
            {data.length > 0 ? (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-md shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(data[0]).map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 10).map((row, index) => ( // 最初の10行のみ表示
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 10 && (
                  <p className="p-3 text-sm text-gray-500 text-center">
                    ...他 {data.length - 10} 行 (最初の10行のみ表示)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">表示するデータがありません。</p>
            )}
            {/* DataChartコンポーネントを追加 */}
            {data.length > 0 && <DataChart data={data} />}
          </div>
        )}
      </div>
    </main>
  );
}
