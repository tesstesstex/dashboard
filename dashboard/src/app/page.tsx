'use client';

import { useState, useEffect } from 'react'; // useEffect をインポート
import FileUpload from '@/components/FileUpload';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import DataChart from '@/components/DataChart'; // DataChartコンポーネントをインポート

// basePathを環境変数から取得、なければ空文字（開発時など）
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const SAMPLE_CSV_PATH = `${basePath}/sample_balance_sheet.csv`;

// データ型を定義 (必要に応じて調整)
type DataRow = { [key: string]: string | number };

export default function Home() {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初期読み込みのためtrueに

  // 初期データ読み込みロジック
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(SAMPLE_CSV_PATH);
        if (!response.ok) {
          // 詳細なエラー情報を取得
          const errorText = await response.text().catch(() => 'サーバーからエラー詳細を取得できませんでした。');
          console.error(`Network response was not ok: ${response.status} ${response.statusText}. Server response: ${errorText}`);
          throw new Error(`サンプルCSVの読み込みに失敗しました。サーバー応答: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        Papa.parse<DataRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results: Papa.ParseResult<DataRow>) => {
            if (results.errors && results.errors.length > 0) {
              console.error("Error parsing sample CSV:", results.errors);
              setError(`サンプルCSVのパース中にエラーが発生しました: ${results.errors[0].message}`);
              setData([]);
            } else {
              setData(results.data);
              setFileName('sample_balance_sheet.csv (初期データ)');
            }
            setIsLoading(false);
          },
          error: (err: Error, file?: File | string) => {
            console.error("Error parsing sample CSV:", err, file);
            const message = err.message || 'サンプルCSVのパース中に不明なエラーが発生しました。';
            setError(`サンプルCSVのパース中にエラーが発生しました: ${message}`);
            setIsLoading(false);
            setData([]);
          }
        });
      } catch (e: unknown) {
        console.error("Error fetching or processing sample CSV:", e);
        if (e instanceof Error) {
          setError(`サンプルCSVの読み込み処理に失敗しました: ${e.message}`);
        } else {
          setError(`サンプルCSVの読み込み処理中に不明なエラーが発生しました。`);
        }
        setIsLoading(false);
        setData([]);
      }
    };
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      loadInitialData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列でマウント時に一度だけ実行


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
          dynamicTyping: true,
          complete: (results: Papa.ParseResult<DataRow>) => {
            if (results.errors && results.errors.length > 0) {
              console.error("Error parsing uploaded CSV:", results.errors);
              setError(`CSVパースエラー: ${results.errors[0].message}`);
            } else {
              setData(results.data);
            }
            setIsLoading(false);
          },
          error: (err: Error, fileParam?: File) => { // fileParamとして名前変更
            console.error("Error parsing uploaded CSV:", err, fileParam);
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
              const workbook = XLSX.read(arrayBuffer, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]; // ESLint no-explicit-any を許容 (XLSXライブラリの型)

              if (jsonData.length > 0) {
                const headers = jsonData[0].map(String);
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
          } catch (parseError: unknown) { // unknown型に変更
            let message = 'Excelパース中に不明なエラーが発生しました。';
            if (parseError instanceof Error) {
                message = parseError.message;
            }
            console.error("Error parsing Excel:", parseError);
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
    } catch (err: unknown) { // unknown型に変更
      let message = '処理中に不明なエラーが発生しました。';
      if (err instanceof Error) {
          message = err.message;
      }
      console.error("Error in handleFileUpload:", err);
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
            {data.length > 0 && <DataChart data={data} fileName={fileName} />}
          </div>
        )}
      </div>
    </main>
  );
}
