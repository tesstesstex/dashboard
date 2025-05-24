'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Reactをインポート
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

type DataRow = { [key: string]: string | number };

interface DataChartProps {
  data: DataRow[];
  fileName: string | null;
}

const UPDATED_COLORS = {
  currentAssets: '#a0c4ff', // 流動資産
  fixedAssets: '#8ecae6',   // 固定資産
  currentLiabilities: '#ffd6a5', // 流動負債
  fixedLiabilities: '#ffb347', // 固定負債 (少し濃いオレンジ)
  equity: '#b2d8d8',       // 純資産
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

interface DetailItem {
  name: string;
  value: number;
  percentage: number;
}

interface ChartDataItem {
  category: string;
  [ITEM_KEYS.CURRENT_ASSETS]?: number;
  [ITEM_KEYS.FIXED_ASSETS]?: number;
  [ITEM_KEYS.CURRENT_LIABILITIES]?: number;
  [ITEM_KEYS.FIXED_LIABILITIES]?: number;
  [ITEM_KEYS.NET_ASSETS]?: number;
  [key: string]: any;
  currentAssetDetails?: DetailItem[];
  fixedAssetDetails?: DetailItem[];
  currentLiabilityDetails?: DetailItem[];
  fixedLiabilityDetails?: DetailItem[];
  equityDetails?: DetailItem[];
}

export default function DataChart({ data, fileName }: DataChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const processedDataByYear = useMemo(() => {
    if (!data || data.length === 0) return null;
    const yearKeys = Object.keys(data[0]).filter(key => key !== '科目' && (key.includes('年度') || !isNaN(Number(data[0][key]))));
    if (yearKeys.length === 0) return null;

    const resultByYear: { year: string; chartData: ChartDataItem[] }[] = [];
    const targetYearKeys = yearKeys.slice(0, 2);

    for (const yearKey of targetYearKeys) {
      const yearValues: { [key: string]: number } = {};
      const rawRows: { name: string; value: number }[] = [];
      data.forEach(row => {
        const itemName = String(row['科目']);
        const value = Number(row[yearKey]);
        if (!isNaN(value)) {
          yearValues[itemName] = value;
          if (itemName !== ITEM_KEYS.TOTAL_ASSETS && itemName !== ITEM_KEYS.TOTAL_LIABILITIES && itemName !== '負債純資産合計' && itemName !== '資産合計' && itemName !== '負債合計') {
            rawRows.push({ name: itemName, value });
          }
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

      const currentAssetDetails: DetailItem[] = [];
      const fixedAssetDetails: DetailItem[] = [];
      const currentLiabilityDetails: DetailItem[] = [];
      const fixedLiabilityDetails: DetailItem[] = [];
      const equityDetails: DetailItem[] = [];

      let currentMajorSection: 'assets' | 'liabilities' | 'equity' | 'unknown' = 'unknown';
      let currentMinorSection: 'current' | 'fixed' | 'unknown' = 'unknown';

      rawRows.forEach(row => {
        if (row.name === ITEM_KEYS.CURRENT_ASSETS) { currentMajorSection = 'assets'; currentMinorSection = 'current'; return; }
        if (row.name === ITEM_KEYS.FIXED_ASSETS) { currentMajorSection = 'assets'; currentMinorSection = 'fixed'; return; }
        if (row.name === ITEM_KEYS.CURRENT_LIABILITIES) { currentMajorSection = 'liabilities'; currentMinorSection = 'current'; return; }
        if (row.name === ITEM_KEYS.FIXED_LIABILITIES) { currentMajorSection = 'liabilities'; currentMinorSection = 'fixed'; return; }
        if (row.name === ITEM_KEYS.NET_ASSETS || row.name === '株主資本' || row.name === '純資産合計' || row.name === '純資産') { currentMajorSection = 'equity'; currentMinorSection = 'unknown'; return; }

        // 0円の項目も内訳としてリストアップする（ただしグラフ上のラベルは非表示のまま）
        // if (row.value === 0 && currentMajorSection !== 'equity') return;


        const percentageOfTotalAssets = totalAssets_val > 0 ? parseFloat(((row.value / totalAssets_val) * 100).toFixed(1)) : 0;
        const percentageOfTotalLiabilitiesAndEquity = totalLiabilitiesAndEquity_val > 0 ? parseFloat(((row.value / totalLiabilitiesAndEquity_val) * 100).toFixed(1)) : 0;

        if (currentMajorSection === 'assets') {
          if (currentMinorSection === 'current') {
            currentAssetDetails.push({ name: row.name, value: row.value, percentage: percentageOfTotalAssets });
          } else if (currentMinorSection === 'fixed') {
            fixedAssetDetails.push({ name: row.name, value: row.value, percentage: percentageOfTotalAssets });
          }
        } else if (currentMajorSection === 'liabilities') {
          if (currentMinorSection === 'current') {
            currentLiabilityDetails.push({ name: row.name, value: row.value, percentage: percentageOfTotalLiabilitiesAndEquity });
          } else if (currentMinorSection === 'fixed') {
            fixedLiabilityDetails.push({ name: row.name, value: row.value, percentage: percentageOfTotalLiabilitiesAndEquity });
          }
        } else if (currentMajorSection === 'equity') {
          equityDetails.push({ name: row.name, value: row.value, percentage: percentageOfTotalLiabilitiesAndEquity });
        }
      });

      const yearChartData: ChartDataItem[] = [
        {
          category: '資産',
          [ITEM_KEYS.CURRENT_ASSETS]: parseFloat(((currentAssets_val / totalAssets_val) * 100).toFixed(1)),
          [ITEM_KEYS.FIXED_ASSETS]: parseFloat(((fixedAssets_val / totalAssets_val) * 100).toFixed(1)),
          currentAssetDetails,
          fixedAssetDetails,
          [ITEM_KEYS.CURRENT_LIABILITIES]: 0, [ITEM_KEYS.FIXED_LIABILITIES]: 0, [ITEM_KEYS.NET_ASSETS]: 0,
        },
        {
          category: '負債・純資産',
          [ITEM_KEYS.CURRENT_LIABILITIES]: parseFloat(((currentLiabilities_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          [ITEM_KEYS.FIXED_LIABILITIES]: parseFloat(((fixedLiabilities_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          [ITEM_KEYS.NET_ASSETS]: parseFloat(((equity_val / totalLiabilitiesAndEquity_val) * 100).toFixed(1)),
          currentLiabilityDetails,
          fixedLiabilityDetails,
          equityDetails,
          [ITEM_KEYS.CURRENT_ASSETS]: 0, [ITEM_KEYS.FIXED_ASSETS]: 0,
        }
      ];
      resultByYear.push({ year: yearKey.replace('年度末残高(百万円)', '').replace('残高(百万円)', '').trim(), chartData: yearChartData });
    }
    return resultByYear.sort((a, b) => b.year.localeCompare(a.year));
  }, [data]);

  if (!mounted || !processedDataByYear || processedDataByYear.length === 0) {
    return <p className="mt-6 text-center text-gray-500">グラフを表示するためのデータが不足しているか、形式が正しくありません。</p>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataEntry = payload[0].payload as ChartDataItem;
      const category = dataEntry.category;
      let sections: React.ReactNode[] = [];

      if (category === '資産') {
        if (dataEntry.currentAssetDetails && dataEntry.currentAssetDetails.length > 0) {
          sections.push(
            <div key="ca-section">
              <p className="font-semibold text-gray-700 mt-1 mb-1" style={{color: UPDATED_COLORS.currentAssets}}>流動資産</p>
              {dataEntry.currentAssetDetails.map((item, index) => (
                <p key={`ca-${index}`} className="text-sm ml-2 text-gray-800">
                  {`${item.name}: ${item.value.toLocaleString()} (百万円) - ${item.percentage}%`}
                </p>
              ))}
            </div>
          );
        }
        if (dataEntry.fixedAssetDetails && dataEntry.fixedAssetDetails.length > 0) {
          sections.push(
            <div key="fa-section">
              <p className="font-semibold text-gray-700 mt-3 mb-1" style={{color: UPDATED_COLORS.fixedAssets}}>固定資産</p>
              {dataEntry.fixedAssetDetails.map((item, index) => (
                <p key={`fa-${index}`} className="text-sm ml-2 text-gray-800">
                  {`${item.name}: ${item.value.toLocaleString()} (百万円) - ${item.percentage}%`}
                </p>
              ))}
            </div>
          );
        }
      } else if (category === '負債・純資産') {
        if (dataEntry.currentLiabilityDetails && dataEntry.currentLiabilityDetails.length > 0) {
          sections.push(
            <div key="cl-section">
              <p className="font-semibold text-gray-700 mt-1 mb-1" style={{color: UPDATED_COLORS.currentLiabilities}}>流動負債</p>
              {dataEntry.currentLiabilityDetails.map((item, index) => (
                <p key={`cl-${index}`} className="text-sm ml-2 text-gray-800">
                  {`${item.name}: ${item.value.toLocaleString()} (百万円) - ${item.percentage}%`}
                </p>
              ))}
            </div>
          );
        }
        if (dataEntry.fixedLiabilityDetails && dataEntry.fixedLiabilityDetails.length > 0) {
          sections.push(
            <div key="fl-section">
              <p className="font-semibold text-gray-700 mt-3 mb-1" style={{color: UPDATED_COLORS.fixedLiabilities}}>固定負債</p>
              {dataEntry.fixedLiabilityDetails.map((item, index) => (
                <p key={`fl-${index}`} className="text-sm ml-2 text-gray-800">
                  {`${item.name}: ${item.value.toLocaleString()} (百万円) - ${item.percentage}%`}
                </p>
              ))}
            </div>
          );
        }
        if (dataEntry.equityDetails && dataEntry.equityDetails.length > 0) {
          sections.push(
            <div key="eq-section">
              <p className="font-semibold text-gray-700 mt-3 mb-1" style={{color: UPDATED_COLORS.equity}}>純資産</p>
              {dataEntry.equityDetails.map((item, index) => (
                <p key={`eq-${index}`} className="text-sm ml-2 text-gray-800">
                  {`${item.name}: ${item.value.toLocaleString()} (百万円) - ${item.percentage}%`}
                </p>
              ))}
            </div>
          );
        }
      }

      if (sections.length === 0) return null;

      return (
        <div className="bg-white p-3 border border-gray-300 shadow-lg rounded-md max-w-xs">
          <p className="font-semibold text-gray-700 mb-2">{label} 内訳</p>
          {sections}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value, name } = props;
    if (height < 15 || value === 0) return null;
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
      <div className="flex flex-col md:flex-row md:space-x-4">
        {processedDataByYear.map((yearEntry) => (
          <div key={yearEntry.year} className="flex-1 mb-10 p-4 border rounded-lg shadow-inner">
            <h3 className="text-2xl font-bold text-center mb-6 text-indigo-600">{yearEntry.year}</h3>
            <ResponsiveContainer width="100%" height={450}>
            <BarChart data={yearEntry.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="0%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis width={0} tick={false} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{paddingTop: "10px"}} />

              {/* 資産の部 (下から 固定資産 -> 流動資産) */}
              <Bar dataKey={ITEM_KEYS.FIXED_ASSETS} stackId="a" fill={UPDATED_COLORS.fixedAssets} name={ITEM_KEYS.FIXED_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.FIXED_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.FIXED_ASSETS})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.CURRENT_ASSETS} stackId="a" fill={UPDATED_COLORS.currentAssets} name={ITEM_KEYS.CURRENT_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.CURRENT_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.CURRENT_ASSETS})} />
              </Bar>

              {/* 負債・純資産の部 (下から 純資産 -> 固定負債 -> 流動負債) */}
              <Bar dataKey={ITEM_KEYS.NET_ASSETS} stackId="a" fill={UPDATED_COLORS.equity} name={ITEM_KEYS.NET_ASSETS}>
                <LabelList dataKey={ITEM_KEYS.NET_ASSETS} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.NET_ASSETS})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.FIXED_LIABILITIES} stackId="a" fill={UPDATED_COLORS.fixedLiabilities} name={ITEM_KEYS.FIXED_LIABILITIES}>
                 <LabelList dataKey={ITEM_KEYS.FIXED_LIABILITIES} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.FIXED_LIABILITIES})} />
              </Bar>
              <Bar dataKey={ITEM_KEYS.CURRENT_LIABILITIES} stackId="a" fill={UPDATED_COLORS.currentLiabilities} name={ITEM_KEYS.CURRENT_LIABILITIES}>
                 <LabelList dataKey={ITEM_KEYS.CURRENT_LIABILITIES} content={(props) => renderCustomizedLabel({...props, name: ITEM_KEYS.CURRENT_LIABILITIES})} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
      </div>
    </div>
  );
}