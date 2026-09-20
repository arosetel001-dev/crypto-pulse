import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';

interface SparklinePoint {
  index: number;
  timeLabel: string;
  price: number;
}

interface SparklineChartProps {
  data: number[];
  change24h?: number;
  symbol?: string;
  height?: number;
  width?: number | string;
  showTooltip?: boolean;
  strokeWidth?: number;
  id?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  change24h,
  symbol = 'CRYPTO',
  height = 36,
  width = '100%',
  showTooltip = true,
  strokeWidth = 1.5,
  id,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-slate-500 font-mono"
        style={{ height, width: typeof width === 'number' ? `${width}px` : width }}
      >
        No chart data
      </div>
    );
  }

  // Determine positive or negative trajectory
  const isPositive =
    change24h !== undefined
      ? change24h >= 0
      : data.length > 1
      ? data[data.length - 1] >= data[0]
      : true;

  const strokeColor = isPositive ? '#10b981' : '#f43f5e'; // emerald-500 / rose-500
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)';
  const uniqueId = id || `sparkline-${symbol.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

  // Normalize data with timestamps across 24h
  const pointsCount = data.length;
  const chartData: SparklinePoint[] = data.map((price, idx) => {
    const hoursAgo = Math.round(((pointsCount - 1 - idx) / Math.max(1, pointsCount - 1)) * 24);
    const timeLabel = idx === pointsCount - 1 ? 'Now' : `${hoursAgo}h ago`;
    return {
      index: idx,
      timeLabel,
      price,
    };
  });

  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const padding = (maxPrice - minPrice) * 0.1 || minPrice * 0.02;
  const yDomain: [number, number] = [minPrice - padding, maxPrice + padding];

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height, width: typeof width === 'number' ? `${width}px` : width }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <YAxis domain={yDomain} hide />
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as SparklinePoint;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700/80 rounded-md px-2 py-1 shadow-lg text-[10px] font-mono pointer-events-none z-30">
                      <div className="text-slate-400 text-[9px]">{point.timeLabel}</div>
                      <div className="font-bold text-white">
                        $
                        {point.price >= 10
                          ? point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : point.price >= 1
                          ? point.price.toFixed(3)
                          : point.price.toFixed(5)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={`url(#grad-${uniqueId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
