import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: ChartDataItem[];
  title: string;
  barColor: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 bg-opacity-95 p-3 border border-gray-600 rounded-lg shadow-xl max-w-xs">
        <p className="label text-xs sm:text-sm font-semibold text-gray-200 mb-1">{`${label}`}</p>
        <p className="intro text-xs sm:text-sm text-blue-400">{`Cantidad: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, title, barColor, xAxisLabel, yAxisLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-6 rounded-lg shadow-xl h-96 flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
        <p className="text-gray-400">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-lg shadow-xl h-80 sm:h-96 flex flex-col">
      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-200 mb-2 sm:mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 5,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 8, fill: '#E2E8F0' }} 
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -60, fill: '#E2E8F0', fontSize: 10 }}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 10, fill: '#E2E8F0' }}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#E2E8F0', fontSize: 10, dx: -5 }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}/>
          <Legend wrapperStyle={{paddingTop: '15px', color: '#E2E8F0', fontSize: '12px'}}/>
          <Bar dataKey="value" name="Cantidad" fill={barColor} radius={[3, 3, 0, 0]} barSize={25} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent; 