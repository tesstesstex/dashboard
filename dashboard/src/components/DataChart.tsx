'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'; // LabelList をインポート

type DataRow = { [key: string]: string | number };

interface DataChartProps {
  data: DataRow[];
  fileName: string | null;
}

const UPDATED_COLORS = {
  currentAssets: '#a0c4ff',
  fixedAssets: '#8ecae6',
  currentLiabilities: '#ffd6a5',
  fixedLiabilities: '#fff0a5',
  equity: '#b2d8d8',
};

const ITEM_KEYS = {
  CURRENT_ASSETS: '流動資産',
  FIXED_ASSETS: '固定資産',
  TOTAL_ASSETS: '資産合計',
  CURRENT_LIABILITIES: '流動負債',
  FIXED_LIABILITIES: '固定負債',
  TOTAL_LIABILITIES: '負債合計',
  NET_ASSETS: '純資産',
};

const VALUE_SUFFIX = '_value';

export default function DataChart({ data, fileName }: DataChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const processedDataByYear = useMemo(() => {
    if (!data || data.length === 0) return null;

    const yearKeys = Object.keys(data[0]).filter(key => key !== '科目' && (key.includes('年度') || !isNaN(Number(data[0][key]))));
    if (yearKeys.length === 0) return null;

    const resultByYear: {
      year: string;
      chartData: {
        category: string;
        [key: string]: number | string | undefined;
      }[];
    }[] = [];

    const targetYearKeys = yearKeys.slice(0, 2);

    for (const yearKey of targetYearKeys) {
      const yearValues: { [key: string]: number } = {};
      data.forEach(row => {
        const itemName = String(row['科目']);
        const value = Number(row[yearKey]);
        if (!isNaN(value)) {
          yearValues[itemName] = value;
        }
      });

      const currentAssets_val = yearValues[ITEM_KEYS.CURRENT_ASSETS] || 0;
      const fixedAssets_val = yearValues[ITEM_KEYS.FIXED_ASSETS] || 0;
      const totalAssets_val = yearValues[ITEM_KEYS.TOTAL_ASSETS] || (currentAssets_val + fixedAssets_val);

      const currentLiabilities_val = yearValues[ITEM_KEYS.CURRENT_LIABILITIES] || 0;
      const fixedLiabilities_val = yearValues[ITEM_KEYS.FIXED_LIABILITIES] || 0;
      const totalLiabilities_val = yearValues[ITEM_KEYS.TOTAL_LIABILITIES] || (currentLiabilities_val + fixedLiabilities_val);

      const equity_val = totalAssets_val - totalLiabilities_val;
      const totalLiabilitiesAndEquity_val = totalLiabilities_val + equity_val;

      if (totalAssets_val === 0 || totalLiabilitiesAndEquity_val === 0) continue;

      const yearChartData = [
        {
          category: '資産',
          [ITEM_KEYS.CURRENT_ASSETS]: parseFloat(((currentAssets_val / totalAssets_val) * 100).toFixed(1)),
          [`${ITEM_KEYS.CURRENT_ASSETS}${VALUE_SUFFIX}`]: currentAssets_val,
          [ITEM_KEYS.FIXED_ASSETS]: parseFloat(((fixedAssets_val / totalAssets_val) * 100).toFixed(1)),
          [`${ITEM_KEYS.FIXED_ASSETS}${VALUE_SUFFIX}`]: fixedAssets_val,
          // 負債・純資産のキーは undefined または 0 にしておく
          [ITEM_KEYS.CURRENT_LIABILITIES]: 0,
          [ITEM_KEYS.FIXED_LIABILITIES]: 0,
          [ITEM_KEYS.NET_ASSETS]: 0,
        },
        {
          category: '負債・純資産',
          // 資産のキーは undefined または 0 にしておく
          [ITEM_KEYS.CURRENT_ASSETS]: 0,
          [ITEM_KEYS.FIXED_ASSETS]: 0,
          [ITEM_KEYS.CURRENT_LIABILITIES]: parseFloat(((currentLiabilities_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          [`${ITEM_KEYS.CURRENT_LIABILITIES}${VALUE_SUFFIX}`]: currentLiabilities_val,
          [ITEM_KEYS.FIXED_LIABILITIES]: parseFloat(((fixedLiabilities_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          [`${ITEM_KEYS.FIXED_LIABILITIES}${VALUE_SUFFIX}`]: fixedLiabilities_val,
          [ITEM_KEYS.NET_ASSETS]: parseFloat(((equity_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          [`${ITEM_KEYS.NET_ASSETS}${VALUE_SUFFIX}`]: equity_val,
        }
      ];

      resultByYear.push({
        year: yearKey.replace('年度末残高(百万円)', '').replace('残高(百万円)', '').trim(),
        chartData: yearChartData,
      });
    }
    return resultByYear.sort((a, b) => b.year.localeCompare(a.year));
  }, [data]);

  if (!mounted || !processedDataByYear || processedDataByYear.length === 0) {
    return <p className="mt-6 text-center text-gray-500">グラフを表示するためのデータが不足しているか、形式が正しくありません。</p>;
  }

  const tooltipFormatter = (value: number, name: string, props: any) => {
    const actualValueKey = `${name}${VALUE_SUFFIX}`;
    const actualValue = props.payload[actualValueKey];
    const percentage = value;
    if (actualValue !== undefined) {
      return [`${actualValue.toLocaleString()} (百万円) - ${percentage}%`, name];
    }
    return [`${percentage}%`, name];
  };

  // LabelList用のカスタムコンポーネント (値が小さすぎる場合は表示しないなど調整可能)
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value, name } = props;
    if (height < 15) { // バーの高さが小さすぎる場合はラベルを表示しない
      return null;
    }
    return (
      <text x={x + width / 2} y={y + height / 2} fill="#333" textAnchor="middle" dominantBaseline="middle" fontSize="10">
        {name} ({value}%)
      </text>
    );
  };


  return (
    <div className="mt-8 p-4 sm:p-6 bg-white border border-gray-200 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">
        貸借対照表 構成比 (ファイル: {fileName || 'N/A'})
      </h3>
      <div className="flex flex-col md:flex-row md:space-x-4"> {/* Flex container */}
        {processedDataByYear.map((yearEntry) => (
          <div key={yearEntry.year} className="flex-1 mb-10 p-4 border rounded-lg shadow-inner"> {/* md:w-1/2 を flex-1 に変更して均等幅に */}
            <h3 className="text-2xl font-bold text-center mb-6 text-indigo-600">{yearEntry.year}</h3>
            <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={yearEntry.chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barCategoryGap="0%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis
                width={0}
                tick={false}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend wrapperStyle={{paddingTop: "10px"}} />

              {/* 資産項目 (stackId="a" で資産カテゴリの時のみ描画) */}
              <Bar dataKey={ITEM_KEYS.CURRENT_ASSETS} stackId="a" fill={UPDATED_COLORS.currentAssets} name={ITEM_KEYS.CURRENT_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.CURRENT_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.CURRENT_ASSETS})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.FIXED_ASSETS} stackId="a" fill={UPDATED_COLORS.fixedAssets} name={ITEM_KEYS.FIXED_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.FIXED_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.FIXED_ASSETS})} />
              </Bar>

              {/* 負債・純資産項目 (stackId="a" で負債・純資産カテゴリの時のみ描画、積み上げ順: 純資産 -> 流動負債 -> 固定負債) */}
              <Bar dataKey={ITEM_KEYS.NET_ASSETS} stackId="a" fill={UPDATED_COLORS.equity} name={ITEM_KEYS.NET_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.NET_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.NET_ASSETS})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.CURRENT_LIABILITIES} stackId="a" fill={UPDATED_COLORS.currentLiabilities} name={ITEM_KEYS.CURRENT_LIABILITIES}>
                 <LabelList dataKey={ITEM_KEYS.CURRENT_LIABILITIES} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.CURRENT_LIABILITIES})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.FIXED_LIABILITIES} stackId="a" fill={UPDATED_COLORS.fixedLiabilities} name={ITEM_KEYS.FIXED_LIABILITIES}>
                 <LabelList dataKey={ITEM_KEYS.FIXED_LIABILITIES} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.FIXED_LIABILITIES})} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
      </div> {/* Closing tag for flex container */}
    </div>
  );
}