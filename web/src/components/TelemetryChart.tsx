'use client';

import React from 'react';
import { TelemetryLog } from '@/lib/nanopayments';
import { Thermometer, MapPin, ShieldAlert, Cpu, Sparkles, Activity, Loader2 } from 'lucide-react';

interface TelemetryChartProps {
  logs: TelemetryLog[];
  usdcSpent: number;
  escrowBalance: number;
  onTriggerSpoilage?: () => Promise<void>;
  isSpoilageLoading?: boolean;
}

export default function TelemetryChart({ 
  logs, 
  usdcSpent, 
  escrowBalance,
  onTriggerSpoilage,
  isSpoilageLoading
}: TelemetryChartProps) {
  const latestLog = logs[logs.length - 1];

  // Helper for thermometer heights & colors
  const getTempColor = (temp: number) => {
    if (temp < 2.0) return 'text-blue-500 bg-blue-50'; // Too cold
    if (temp > 8.0) return 'text-red-500 bg-red-50';   // Too warm
    return 'text-emerald-600 bg-emerald-50';          // Optimal
  };

  const getTempStatus = (temp: number) => {
    if (temp < 2.0) return 'UNDER-COOLED (FRAGILE)';
    if (temp > 8.0) return 'OVER-HEATED (WARNING)';
    return 'OPTIMAL COLD CHAIN';
  };

  // Generate SVG path for temperature history line chart
  const renderLineChart = () => {
    if (logs.length < 2) return null;

    const width = 450;
    const height = 120;
    const padding = 15;

    const temps = logs.map(l => l.temperature);
    const minTemp = Math.min(...temps, 0);
    const maxTemp = Math.max(...temps, 10);
    const tempRange = maxTemp - minTemp || 1;

    const points = logs.map((log, idx) => {
      const x = padding + (idx / (logs.length - 1)) * (width - padding * 2);
      const y = height - padding - ((log.temperature - minTemp) / tempRange) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid lines */}
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#E5E7EB" strokeDasharray="3,3" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E5E7EB" strokeDasharray="3,3" />
        
        {/* Chart Line */}
        <polyline
          fill="none"
          stroke="#06B6D4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-sm"
        />

        {/* Individual data node circles */}
        {logs.map((log, idx) => {
          const x = padding + (idx / (logs.length - 1)) * (width - padding * 2);
          const y = height - padding - ((log.temperature - minTemp) / tempRange) * (height - padding * 2);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              className="fill-cyan-500 stroke-white stroke-2 hover:r-6 cursor-pointer transition-all"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 space-y-6">
      
      {/* ⚠️ Temperature Violation Hazard Banner */}
      {latestLog && latestLog.temperature > 8.0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-950 text-xs block">⚠️ Cold Chain Temperature Breach Detected!</span>
              <p className="text-[11px] text-red-700 leading-relaxed mt-1">
                The current sensor temperature is {latestLog.temperature}°C, exceeding the safe limit (8.0°C) for agricultural produce. 
                Spoilage risk is critical. Action is recommended to report damage.
              </p>
            </div>
          </div>
          {onTriggerSpoilage && (
            <button
              type="button"
              onClick={onTriggerSpoilage}
              disabled={isSpoilageLoading}
              className="px-4 py-2.5 bg-red-650 hover:bg-red-750 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow shrink-0 flex items-center gap-1.5 transition-all self-end md:self-center"
            >
              {isSpoilageLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              Report Cargo Spoiled
            </button>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Thermometer / Temp */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">IoT Sensor Temperature</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {latestLog ? `${latestLog.temperature} °C` : '--'}
            </span>
            {latestLog && (
              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${getTempColor(latestLog.temperature)}`}>
                {getTempStatus(latestLog.temperature)}
              </span>
            )}
          </div>
          <div className="p-3 bg-white border border-gray-150 rounded-xl">
            <Thermometer className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        {/* GPS Location */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">GPS Stream coordinates</span>
            <span className="text-sm font-bold text-gray-900 block font-mono leading-relaxed">
              {latestLog ? `${latestLog.latitude},` : '--'}
              <br />
              {latestLog ? latestLog.longitude : '--'}
            </span>
          </div>
          <div className="p-3 bg-white border border-gray-150 rounded-xl">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Micropayment ledger */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">x402 Micro-Settle ledger</span>
            <span className="text-lg font-bold text-gray-900 block font-mono">
              Spent: ${usdcSpent.toFixed(6)} USDC
            </span>
            <span className="text-[9px] text-gray-400 block">
              Gateway Escrow: ${escrowBalance.toFixed(4)} USDC
            </span>
          </div>
          <div className="p-3 bg-white border border-gray-150 rounded-xl">
            <Activity className="w-6 h-6 text-cyan-500 animate-pulse" />
          </div>
        </div>

      </div>

      {/* SVG Line Chart */}
      {logs.length >= 2 ? (
        <div className="space-y-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Live Temperature Log Chart</span>
          <div className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-center">
            {renderLineChart()}
          </div>
        </div>
      ) : (
        <div className="h-32 bg-gray-50 border border-dashed border-gray-250 rounded-2xl flex flex-col items-center justify-center text-gray-400">
          <Cpu className="w-8 h-8 text-gray-300 mb-2 animate-spin" />
          <span className="text-xs font-mono">Waiting for x402 telemetry stream packets...</span>
        </div>
      )}

      {/* Logs Table */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Received Packets Logs</span>
            <span className="text-[9px] text-cyan-600 font-bold font-mono">Replay proof active</span>
          </div>
          <div className="overflow-x-auto border border-gray-100 rounded-2xl max-h-40 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[10px] font-mono">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500">
                  <th className="p-2.5 font-bold uppercase">Timestamp</th>
                  <th className="p-2.5 font-bold uppercase text-center">Temp</th>
                  <th className="p-2.5 font-bold uppercase">GPS Position</th>
                  <th className="p-2.5 font-bold uppercase text-right">Payment Nonce</th>
                </tr>
              </thead>
              <tbody>
                {[...logs].reverse().map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/20">
                    <td className="p-2.5 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2.5 text-center font-bold text-gray-900">{log.temperature} °C</td>
                    <td className="p-2.5 text-gray-600">{log.latitude}, {log.longitude}</td>
                    <td className="p-2.5 text-right text-cyan-600 font-bold">{log.paymentRef.slice(-12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
