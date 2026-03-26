'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', words: 4000 },
  { name: 'Tue', words: 3000 },
  { name: 'Wed', words: 2000 },
  { name: 'Thu', words: 2780 },
  { name: 'Fri', words: 1890 },
  { name: 'Sat', words: 2390 },
  { name: 'Sun', words: 3490 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-purple-400 font-bold text-sm">
          {payload[0].value.toLocaleString()} words
        </p>
      </div>
    );
  }
  return null;
};

export default function UsageChart() {
  return (
    <div className="w-full h-[200px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="words" 
            stroke="#9333ea" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorWords)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}