"use client";

import { PnLSnapshot } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PnLChartProps {
  history: PnLSnapshot[];
}

export function PnLChart({ history }: PnLChartProps) {
  const data = history.map((s) => ({
    date: s.date.slice(5), // "03-02" 형식
    value: s.totalValue,
    pnl: s.pnl,
  }));

  const isProfit = history.length > 0 && history[history.length - 1].pnl >= 0;

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">누적 수익 차트</h4>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isProfit ? "#22c55e" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isProfit ? "#22c55e" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(val) => [`$${Number(val ?? 0).toFixed(0)}`, "총 가치"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isProfit ? "#22c55e" : "#ef4444"}
              fill="url(#pnlGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
