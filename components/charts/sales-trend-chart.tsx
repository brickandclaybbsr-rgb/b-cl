"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatINR } from "@/lib/utils";

export interface TrendPoint {
  label: string;
  cash: number;
  online: number;
  aggregator: number;
}

const SERIES = [
  { key: "cash", name: "Cash", color: "#FFFFFF" },
  { key: "online", name: "Online", color: "#9A9AA2" },
  { key: "aggregator", name: "Swiggy/Zomato", color: "#4D4D55" },
] as const;

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#8B8B92"
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          stroke="#8B8B92"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{
            background: "#121214",
            border: "1px solid #242428",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#FAFAFA", fontWeight: 600 }}
          formatter={(value: number, name) => [formatINR(value), name]}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "#8B8B92" }}
        />
        {SERIES.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId="sales"
            fill={s.color}
            radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
