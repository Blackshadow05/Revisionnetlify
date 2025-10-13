import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
    [key: string]: unknown;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2a3347] bg-opacity-95 backdrop-blur-xl p-3 border border-[#c9a45c]/30 rounded-xl shadow-2xl max-w-xs">
        <p className="label text-xs sm:text-sm font-semibold text-gray-200 mb-1">{`${label}`}</p>
        <p className="intro text-xs sm:text-sm" style={{ color: payload[0].color }}>{`Cantidad: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, title, barColor, xAxisLabel, yAxisLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-6 shadow-2xl h-96 flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
        <p className="text-gray-400">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  // Función para truncar nombres largos y añadir tooltip
  const formatXAxisLabel = (value: string) => {
    return value.length > 12 ? `${value.substring(0, 12)}...` : value;
  };

  // Generar ID único para el gradiente
  const gradientId = `colorGradient-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-4 md:p-6 shadow-2xl h-80 sm:h-96 flex flex-col bar-chart">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#c9a45c] to-[#ff8c42] bg-clip-text text-transparent">
            {title}
          </h3>
          {xAxisLabel && (
            <p className="text-gray-400 text-xs md:text-sm mt-1">{xAxisLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: barColor }}></div>
          <span className="text-gray-300">Datos</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 15,
            left: -10,
            bottom: 40,
          }}
        >
          <defs>
            <linearGradient id={`colorGradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={barColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={barColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            fontSize={10}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={{ stroke: '#4b5563' }}
            tickFormatter={formatXAxisLabel}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            allowDecimals={false}
            stroke="#9ca3af"
            fontSize={10}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={{ stroke: '#4b5563' }}
            width={30}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: '10px' },
              dx: -5
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201, 164, 92, 0.1)' }}/>
          <Bar
            dataKey="value"
            name="Cantidad"
            fill={`url(#${gradientId})`}
            stroke={barColor}
            strokeWidth={1}
            radius={[3, 3, 0, 0]}
            barSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;