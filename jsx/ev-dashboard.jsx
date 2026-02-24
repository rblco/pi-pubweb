import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart, AreaChart } from "recharts";

// ── NTP Project Data (simulated from STAR schema spread tables) ──
const generateSpreadData = () => {
  const phases = {
    "ALL": { name: "NTP - All Phases", bac: 49136385 },
    "PESA": { name: "Preliminary Engineering", bac: 4030560 },
    "DBA-DESIGN": { name: "Design Build - Design", bac: 2917710 },
    "DBA-CONST": { name: "Design Build - Construction", bac: 39377160 },
    "PERMIT": { name: "Permitting", bac: 1420720 },
    "PM": { name: "Project Management", bac: 1390235 },
  };

  const months = [];
  const startDate = new Date(2011, 7, 1); // Aug 2011
  for (let i = 0; i < 84; i++) { // 7 years
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    months.push({
      date: d,
      label: d.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
      monthIndex: i,
    });
  }

  // S-curve shape generator (beta distribution approximation)
  const sCurve = (t, skew = 0.35) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const a = 1 / skew;
    return Math.pow(t, a) / (Math.pow(t, a) + Math.pow(1 - t, a));
  };

  // Phase timing (month offsets from project start)
  const phaseSchedule = {
    "PESA": { start: 0, end: 18, evDelay: 1, acVariance: 1.04 },
    "DBA-DESIGN": { start: 12, end: 42, evDelay: 2, acVariance: 1.08 },
    "DBA-CONST": { start: 24, end: 72, evDelay: 3, acVariance: 1.12 },
    "PERMIT": { start: 0, end: 60, evDelay: 1, acVariance: 0.98 },
    "PM": { start: 0, end: 78, evDelay: 0, acVariance: 1.02 },
  };

  const dataDate = 36; // Month 36 = Aug 2014 (data date)

  const phaseData = {};

  Object.entries(phaseSchedule).forEach(([key, sched]) => {
    const bac = phases[key].bac;
    const duration = sched.end - sched.start;
    const data = months.map((m, i) => {
      const t = (i - sched.start) / duration;
      const tEv = (i - sched.start - sched.evDelay) / duration;

      let pv = sCurve(t, 0.38) * bac;
      let ev = i <= dataDate ? sCurve(tEv, 0.35) * bac * 0.92 : null;
      let ac = i <= dataDate ? (ev || 0) * sched.acVariance : null;

      if (i > sched.end) pv = bac;
      if (t < 0) pv = 0;
      if (tEv < 0 && ev !== null) ev = 0;
      if (i > dataDate) { ev = null; ac = null; }

      // Add slight monthly noise
      const noise = 1 + (Math.sin(i * 7.3 + key.length) * 0.015);
      pv *= noise;
      if (ev !== null) ev *= noise;
      if (ac !== null) ac *= (1 + Math.sin(i * 5.1) * 0.02);

      return {
        month: m.label,
        monthIndex: i,
        pv: Math.round(pv),
        ev: ev !== null ? Math.round(ev) : null,
        ac: ac !== null ? Math.round(ac) : null,
      };
    });
    phaseData[key] = data;
  });

  // Generate ALL (sum of phases)
  phaseData["ALL"] = months.map((m, i) => {
    let pv = 0, ev = 0, ac = 0;
    let hasActuals = false;
    Object.keys(phaseSchedule).forEach(key => {
      const pd = phaseData[key][i];
      pv += pd.pv;
      if (pd.ev !== null) { ev += pd.ev; hasActuals = true; }
      if (pd.ac !== null) ac += pd.ac;
    });
    return {
      month: m.label,
      monthIndex: i,
      pv: Math.round(pv),
      ev: hasActuals ? Math.round(ev) : null,
      ac: hasActuals ? Math.round(ac) : null,
    };
  });

  return { phases, phaseData, months, dataDate };
};

const { phases, phaseData, months, dataDate } = generateSpreadData();

// ── Formatting helpers ──
const fmtCost = (v) => {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtPct = (v) => {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
};

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(148, 163, 184, 0.2)",
      borderRadius: 8, padding: "12px 16px", backdropFilter: "blur(8px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <p style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 8px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 10, height: 3, borderRadius: 2, background: p.color }} />
          <span style={{ color: "#cbd5e1", fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}>{p.name}:</span>
          <span style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmtCost(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ──
const KpiCard = ({ label, value, subtitle, trend, color = "#e2e8f0" }) => (
  <div style={{
    background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(71, 85, 105, 0.4)",
    borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 140,
    borderTop: `3px solid ${color}`,
  }}>
    <div style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5,
      fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1.2 }}>{value}</div>
    {subtitle && <div style={{ color: "#64748b", fontSize: 11, marginTop: 4,
      fontFamily: "'IBM Plex Sans', sans-serif" }}>{subtitle}</div>}
    {trend != null && (
      <div style={{
        marginTop: 6, fontSize: 11, fontWeight: 600,
        color: trend >= 1 ? "#4ade80" : trend >= 0.95 ? "#fbbf24" : "#f87171",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {trend >= 1 ? "▲" : trend >= 0.95 ? "◆" : "▼"} {fmtPct(trend)}
      </div>
    )}
  </div>
);

// ── Phase Selector Button ──
const PhaseBtn = ({ id, name, active, onClick, bac }) => (
  <button
    onClick={() => onClick(id)}
    style={{
      padding: "10px 16px", borderRadius: 8, border: "1px solid",
      borderColor: active ? "#3b82f6" : "rgba(71, 85, 105, 0.4)",
      background: active ? "rgba(59, 130, 246, 0.15)" : "rgba(30, 41, 59, 0.4)",
      color: active ? "#93c5fd" : "#94a3b8", cursor: "pointer",
      textAlign: "left", transition: "all 0.2s",
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{name}</div>
    <div style={{ fontSize: 10, opacity: 0.7, fontFamily: "'JetBrains Mono', monospace" }}>
      BAC: {fmtCost(bac)}
    </div>
  </button>
);

// ── Variance Bar ──
const VarianceBar = ({ label, value, max, color }) => {
  const pct = Math.min(Math.abs(value) / max * 100, 100);
  const isNeg = value < 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</span>
        <span style={{
          color: isNeg ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace"
        }}>{fmtCost(value)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(51, 65, 85, 0.5)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: isNeg
            ? "linear-gradient(90deg, #f87171, #ef4444)"
            : "linear-gradient(90deg, #4ade80, #22c55e)",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
};

// ── Main Dashboard ──
export default function SCurveDashboard() {
  const [selectedPhase, setSelectedPhase] = useState("ALL");

  const data = useMemo(() => phaseData[selectedPhase], [selectedPhase]);
  const phase = phases[selectedPhase];

  // Calculate EV metrics at data date
  const metrics = useMemo(() => {
    const ddRow = data[dataDate];
    const pv = ddRow?.pv || 0;
    const ev = ddRow?.ev || 0;
    const ac = ddRow?.ac || 0;
    const bac = phase.bac;

    const cpi = ac > 0 ? ev / ac : 0;
    const spi = pv > 0 ? ev / pv : 0;
    const cv = ev - ac;
    const sv = ev - pv;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const vac = bac - eac;
    const pctComplete = bac > 0 ? ev / bac : 0;
    const pctSpent = bac > 0 ? ac / bac : 0;

    return { pv, ev, ac, bac, cpi, spi, cv, sv, eac, etc, vac, pctComplete, pctSpent };
  }, [data, phase]);

  // Filter data to show only months with values
  const chartData = useMemo(() => {
    return data.filter(d => d.pv > 0 || d.ev > 0 || d.ac > 0);
  }, [data]);

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      color: "#e2e8f0", fontFamily: "'IBM Plex Sans', sans-serif",
      padding: "24px 28px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5,
            background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Earned Value S-Curve
          </h1>
          <span style={{
            fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 1, textTransform: "uppercase",
          }}>Denver Metro • Northern Treatment Plant</span>
        </div>
        <div style={{
          fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace",
        }}>
          Data Date: Aug 2014 &nbsp;│&nbsp; BAC: {fmtCost(phase.bac)} &nbsp;│&nbsp; Source: Primavera P6 → STAR Schema → Microsoft Fabric
        </div>
      </div>

      {/* Phase Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(phases).map(([id, p]) => (
          <PhaseBtn key={id} id={id} name={p.name} bac={p.bac}
            active={selectedPhase === id} onClick={setSelectedPhase} />
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KpiCard label="Budget at Completion" value={fmtCost(metrics.bac)} color="#e2e8f0" />
        <KpiCard label="Planned Value (BCWS)" value={fmtCost(metrics.pv)} color="#3b82f6"
          subtitle="Cumulative at data date" />
        <KpiCard label="Earned Value (BCWP)" value={fmtCost(metrics.ev)} color="#22c55e"
          subtitle={`${fmtPct(metrics.pctComplete)} complete`} />
        <KpiCard label="Actual Cost (ACWP)" value={fmtCost(metrics.ac)} color="#f59e0b"
          subtitle={`${fmtPct(metrics.pctSpent)} of BAC spent`} />
        <KpiCard label="CPI" value={metrics.cpi.toFixed(3)} color={metrics.cpi >= 1 ? "#4ade80" : "#f87171"}
          trend={metrics.cpi} subtitle="Cost Performance" />
        <KpiCard label="SPI" value={metrics.spi.toFixed(3)} color={metrics.spi >= 1 ? "#4ade80" : "#fbbf24"}
          trend={metrics.spi} subtitle="Schedule Performance" />
      </div>

      {/* Main S-Curve Chart */}
      <div style={{
        background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(71, 85, 105, 0.3)",
        borderRadius: 12, padding: "20px 16px 12px", marginBottom: 20,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 16, paddingLeft: 8,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          CUMULATIVE COST S-CURVE — {phase.name.toUpperCase()}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.25)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              interval={Math.floor(chartData.length / 12)} axisLine={{ stroke: "#334155" }} tickLine={{ stroke: "#334155" }} />
            <YAxis tickFormatter={(v) => fmtCost(v)}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={{ stroke: "#334155" }} tickLine={{ stroke: "#334155" }} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", paddingTop: 8 }}
              iconType="plainline" iconSize={18}
            />

            {/* PV area fill */}
            <Area type="monotone" dataKey="pv" fill="url(#pvGrad)" stroke="none"
              name="PV Area" legendType="none" />

            {/* Planned Value (BCWS) */}
            <Line type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={2.5}
              dot={false} name="Planned Value (BCWS)" strokeDasharray="8 4" />

            {/* Earned Value (BCWP) */}
            <Area type="monotone" dataKey="ev" fill="url(#evGrad)" stroke="none"
              name="EV Area" legendType="none" />
            <Line type="monotone" dataKey="ev" stroke="#22c55e" strokeWidth={2.5}
              dot={false} name="Earned Value (BCWP)" connectNulls={false} />

            {/* Actual Cost (ACWP) */}
            <Line type="monotone" dataKey="ac" stroke="#f59e0b" strokeWidth={2}
              dot={false} name="Actual Cost (ACWP)" strokeDasharray="4 2" connectNulls={false} />

            {/* BAC reference */}
            <ReferenceLine y={phase.bac} stroke="#64748b" strokeDasharray="6 6" strokeWidth={1}
              label={{ value: `BAC ${fmtCost(phase.bac)}`, position: "right",
                fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />

            {/* Data date line */}
            <ReferenceLine x={months[dataDate].label} stroke="#f472b6" strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: "Data Date", position: "top",
                fill: "#f472b6", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row: Variances + Forecast */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Variance Panel */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(71, 85, 105, 0.3)",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>VARIANCE ANALYSIS</div>
          <VarianceBar label="Cost Variance (CV = EV − AC)" value={metrics.cv} max={metrics.bac * 0.15}
            color={metrics.cv >= 0 ? "#4ade80" : "#f87171"} />
          <VarianceBar label="Schedule Variance (SV = EV − PV)" value={metrics.sv} max={metrics.bac * 0.15}
            color={metrics.sv >= 0 ? "#4ade80" : "#fbbf24"} />
          <div style={{ marginTop: 16, borderTop: "1px solid rgba(71, 85, 105, 0.3)", paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>CV%</span>
              <span style={{
                color: metrics.cv >= 0 ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace"
              }}>{metrics.ev > 0 ? fmtPct(metrics.cv / metrics.ev) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>SV%</span>
              <span style={{
                color: metrics.sv >= 0 ? "#4ade80" : "#fbbf24", fontSize: 12, fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace"
              }}>{metrics.pv > 0 ? fmtPct(metrics.sv / metrics.pv) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Forecast Panel */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(71, 85, 105, 0.3)",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>FORECAST & INDICES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
            {[
              { label: "EAC", value: fmtCost(metrics.eac), sub: "Estimate at Completion" },
              { label: "ETC", value: fmtCost(metrics.etc), sub: "Estimate to Complete" },
              { label: "VAC", value: fmtCost(metrics.vac), sub: "Variance at Completion",
                color: metrics.vac >= 0 ? "#4ade80" : "#f87171" },
              { label: "TCPI", value: metrics.etc > 0 ?
                ((metrics.bac - metrics.ev) / (metrics.bac - metrics.ac)).toFixed(3) : "—",
                sub: "To-Complete Perf Index" },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase",
                  letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{
                  color: item.color || "#e2e8f0", fontSize: 18, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{item.value}</div>
                <div style={{ color: "#475569", fontSize: 10, marginTop: 1 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Performance gauge */}
          <div style={{ marginTop: 18, borderTop: "1px solid rgba(71, 85, 105, 0.3)", paddingTop: 14 }}>
            <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 8,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              PROJECT HEALTH
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Cost</div>
                <div style={{
                  height: 8, background: "rgba(51, 65, 85, 0.5)", borderRadius: 4,
                  overflow: "hidden", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: "50%", top: 0, width: 2, height: "100%",
                    background: "#475569",
                  }} />
                  <div style={{
                    height: "100%", width: `${Math.min(metrics.cpi * 50, 100)}%`,
                    borderRadius: 4,
                    background: metrics.cpi >= 1
                      ? "linear-gradient(90deg, #22c55e, #4ade80)"
                      : metrics.cpi >= 0.95
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #ef4444, #f87171)",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Schedule</div>
                <div style={{
                  height: 8, background: "rgba(51, 65, 85, 0.5)", borderRadius: 4,
                  overflow: "hidden", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: "50%", top: 0, width: 2, height: "100%",
                    background: "#475569",
                  }} />
                  <div style={{
                    height: "100%", width: `${Math.min(metrics.spi * 50, 100)}%`,
                    borderRadius: 4,
                    background: metrics.spi >= 1
                      ? "linear-gradient(90deg, #22c55e, #4ade80)"
                      : metrics.spi >= 0.95
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #ef4444, #f87171)",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary Panel */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(71, 85, 105, 0.3)",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>POWER BI IMPLEMENTATION</div>
          <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>Source Tables:</span>
              <div style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginTop: 2 }}>
                W_PROJECT_SPREAD_F<br />
                W_ACTIVITY_SPREAD_F<br />
                W_WBS_SPREAD_F<br />
                W_PROJECT_D • W_WBS_D
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>Key Columns:</span>
              <div style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginTop: 2 }}>
                SPREAD_START_DATE<br />
                PLANNED_TOTAL_COST<br />
                ACTUAL_TOTAL_COST<br />
                EARNED_VALUE_COST
              </div>
            </div>
            <div>
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>DAX Pattern:</span>
              <div style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginTop: 2 }}>
                Cumulative PV =<br />
                &nbsp;&nbsp;CALCULATE(<br />
                &nbsp;&nbsp;&nbsp;&nbsp;SUM([PLANNED_TOTAL_COST]),<br />
                &nbsp;&nbsp;&nbsp;&nbsp;FILTER(ALL(DimDate),<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DimDate[Date] &lt;= MAX(...)))<br />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 20, padding: "12px 0", borderTop: "1px solid rgba(71, 85, 105, 0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: "#334155", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          RBLCO • P6 EPPM → Oracle STAR Schema → Microsoft Fabric → Power BI
        </span>
        <span style={{ color: "#334155", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          S-Curve Preview • Production version in Power BI Semantic Model
        </span>
      </div>
    </div>
  );
}
