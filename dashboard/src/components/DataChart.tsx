'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DataRow = { [key: string]: string | number };

interface DataChartProps {
  data: DataRow[];
}

export default function DataChart({ data }: DataChartProps) {
  const [mounted, setMounted] = useState(false);
  const [xAxisKey, setXAxisKey] = useState<string | null>(null);
  const [yAxisKey, setYAxisKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true); // Client-side only rendering for Recharts
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      // Heuristic to find potential categorical and numerical keys
      const potentialXKeys = keys.filter(key => typeof data[0][key] === 'string');
      const potentialYKeys = keys.filter(key => typeof data[0][key] === 'number' || !isNaN(Number(data[0][key])));

      if (potentialXKeys.length > 0) {
        setXAxisKey(potentialXKeys[0]);
      } else if (keys.length > 0) {
        setXAxisKey(keys[0]); // Fallback
      }

      if (potentialYKeys.length > 0) {
        setYAxisKey(potentialYKeys[0]);
      } else if (keys.length > 1) {
        setYAxisKey(keys[1]); // Fallback
      } else if (keys.length > 0) {
        setYAxisKey(keys[0]);
      }
    } else {
      setXAxisKey(null);
      setYAxisKey(null);
    }
  }, [data]);

  const chartData = useMemo(() => {
    if (!xAxisKey || !yAxisKey || data.length === 0) return [];
    return data.map(row => ({
      ...row,
      [yAxisKey]: Number(row[yAxisKey]) // Ensure Y-axis data is numeric
    }));
  }, [data, xAxisKey, yAxisKey]);

  if (!mounted || data.length === 0) {
    return <p className="mt-6 text-center text-gray-500">グラフを表示するデータがありません、または軸を選択してください。</p>;
  }

  const availableKeys = Object.keys(data[0]);

  return (
    <div className="mt-8 p-4 sm:p-6 bg-white border border-gray-200 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">データグラフ</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="xAxisSelect" className="block text-sm font-medium text-gray-700 mb-1">
            X軸 (カテゴリ):
          </label>
          <select
            id="xAxisSelect"
            value={xAxisKey || ''}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>X軸を選択</option>
            {availableKeys.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yAxisSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Y軸 (数値):
          </label>
          <select
            id="yAxisSelect"
            value={yAxisKey || ''}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>Y軸を選択</option>
            {availableKeys.filter(key => typeof data[0][key] === 'number' || !isNaN(Number(data[0][key]))).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
             {availableKeys.filter(key => !(typeof data[0][key] === 'number' || !isNaN(Number(data[0][key])))).length > 0 && <option disabled>---</option>}
            {availableKeys.filter(key => !(typeof data[0][key] === 'number' || !isNaN(Number(data[0][key])))).map(key => (
              <option key={key} value={key} disabled>{key} (非数値)</option>
            ))}
          </select>
        </div>
      </div>

      {xAxisKey && yAxisKey ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxisKey} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500">X軸とY軸を選択してグラフを表示してください。</p>
      )}
    </div>
  );
}