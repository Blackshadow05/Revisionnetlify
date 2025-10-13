'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface AreaCheckInChartProps {
  data: ChartDataItem[];
  currentYear: number;
}

const AreaCheckInChart: React.FC<AreaCheckInChartProps> = ({ data, currentYear }) => {
  return (
    <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-4 md:p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#c9a45c] to-[#ff8c42] bg-clip-text text-transparent">
            Check In Mensual {currentYear}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1">Tendencia de registros por mes</p>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-3 h-3 bg-gradient-to-r from-[#ff8c42] to-[#c9a45c] rounded-full"></div>
          <span className="text-gray-300">Check In</span>
        </div>
      </div>

      <ResponsiveContainer
        width="100%"
        aspect={2.2}
        className="h-48 sm:h-56 md:!h-[280px]"
      >
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCheckIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff8c42" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#c9a45c" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            fontSize={10}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={{ stroke: '#4b5563' }}
            tickFormatter={(value) => String(value).slice(0, 3)}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={40}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={10}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={{ stroke: '#4b5563' }}
            width={30}
          />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#ff8c42" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCheckIn)"
            dot={{ fill: '#ff8c42', r: 3 }}
            activeDot={{ r: 5, fill: '#c9a45c', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaCheckInChart;