import { useState } from "react";

// ── Program Intel Architecture Blueprint ──
// Validated architecture: React SPA → APIM → Backend Aggregation → 3 Data Sources
// Environment: RBLCO Azure Dev (rg-rzpi-p6-dev01)

const colors = {
  bg: "#0a0e1a",
  cardBg: "rgba(15, 23, 42, 0.85)",
  border: "rgba(71, 85, 105, 0.35)",
  borderHover: "rgba(99, 128, 170, 0.6)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent1: "#3b82f6",  // blue - SharePoint
  accent2: "#8b5cf6",  // purple - Fabric
  accent3: "#f59e0b",  // amber - P6
  accent4: "#06b6d4",  // cyan - APIM
  accent5: "#10b981",  // green - React
  accent6: "#ec4899",  // pink - RBAC
  line: "rgba(148, 163, 184, 0.15)",
};

const fontMono = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";
const fontSans = "'IBM Plex Sans', 'SF Pro Display', -apple-system, sans-serif";

// ── Architecture Node Component ──
const ArchNode = ({ x, y, w, h, label, sublabel, icon, color, details, pulse, onClick, selected }) => (
  <g
    onClick={onClick}
    style={{ cursor: "pointer" }}
  >
    {/* Glow effect */}
    {(selected || pulse) && (
      <rect
        x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={14}
        fill="none" stroke={color} strokeWidth={1.5}
        opacity={selected ? 0.6 : 0.3}
        style={pulse ? { animation: "pulse 2s ease-in-out infinite" } : {}}
      />
    )}
    {/* Card background */}
    <rect
      x={x} y={y} width={w} height={h} rx={12}
      fill={colors.cardBg}
      stroke={selected ? color : colors.border}
      strokeWidth={selected ? 1.5 : 1}
    />
    {/* Top accent bar */}
    <rect x={x} y={y} width={w} height={4} rx={12}
      fill={color} opacity={0.8}
      clipPath={`inset(0 0 ${h - 4}px 0)`}
    />
    <line x1={x} y1={y + 4} x2={x + w} y2={y + 4} stroke={color} strokeWidth={2} opacity={0.6} />
    {/* Icon */}
    <text x={x + 14} y={y + 28} fontSize={16} fill={color}>{icon}</text>
    {/* Label */}
    <text x={x + 36} y={y + 28} fontSize={12} fontWeight={700} fill={colors.text}
      fontFamily={fontSans}>{label}</text>
    {/* Sublabel */}
    {sublabel && (
      <text x={x + 14} y={y + 46} fontSize={9} fill={colors.textDim}
        fontFamily={fontMono} letterSpacing={0.3}>{sublabel}</text>
    )}
    {/* Details */}
    {details && details.map((d, i) => (
      <text key={i} x={x + 14} y={y + 62 + i * 14} fontSize={9} fill={colors.textMuted}
        fontFamily={fontMono}>{d}</text>
    ))}
  </g>
);

// ── Connection Arrow Component ──
const Arrow = ({ x1, y1, x2, y2, color = colors.textDim, label, dashed, bidirectional }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const arrowSize = 6;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={1.2}
        strokeDasharray={dashed ? "6 4" : "none"}
        opacity={0.6}
      />
      {/* Arrowhead */}
      <polygon
        points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - 0.4)},${y2 - arrowSize * Math.sin(angle - 0.4)} ${x2 - arrowSize * Math.cos(angle + 0.4)},${y2 - arrowSize * Math.sin(angle + 0.4)}`}
        fill={color} opacity={0.6}
      />
      {bidirectional && (
        <polygon
          points={`${x1},${y1} ${x1 + arrowSize * Math.cos(angle - 0.4)},${y1 + arrowSize * Math.sin(angle - 0.4)} ${x1 + arrowSize * Math.cos(angle + 0.4)},${y1 + arrowSize * Math.sin(angle + 0.4)}`}
          fill={color} opacity={0.6}
        />
      )}
      {label && (
        <g>
          <rect x={midX - label.length * 3.2} y={midY - 8} width={label.length * 6.4} height={14}
            rx={3} fill={colors.bg} stroke={color} strokeWidth={0.5} opacity={0.9} />
          <text x={midX} y={midY + 3} fontSize={8} fill={color}
            textAnchor="middle" fontFamily={fontMono} letterSpacing={0.3}>{label}</text>
        </g>
      )}
    </g>
  );
};

// ── Zone Box Component ──
const Zone = ({ x, y, w, h, label, color, sublabel }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={16}
      fill="none" stroke={color} strokeWidth={1}
      strokeDasharray="8 4" opacity={0.25}
    />
    <rect x={x + 12} y={y - 8} width={label.length * 7.5 + 20} height={16} rx={4}
      fill={colors.bg} stroke={color} strokeWidth={0.8} opacity={0.8}
    />
    <text x={x + 22} y={y + 4} fontSize={9} fontWeight={700} fill={color}
      fontFamily={fontMono} letterSpacing={1.2} textTransform="uppercase">{label}</text>
    {sublabel && (
      <text x={x + w - 12} y={y + 4} fontSize={8} fill={colors.textDim}
        fontFamily={fontMono} textAnchor="end">{sublabel}</text>
    )}
  </g>
);

// ── Detail Panel Component ──
const DetailPanel = ({ node, onClose }) => {
  if (!node) return null;
  const nodeDetails = {
    react: {
      title: "React SPA (Frontend)",
      tech: "React 18 + TypeScript + Tailwind CSS",
      auth: "MSAL React (@azure/msal-react)",
      details: [
        "Single Page Application with client-side routing",
        "MSAL.js handles Entra ID authentication flow",
        "Acquires tokens scoped per data source via APIM",
        "JSX components consume unified API responses",
        "Role-based UI rendering per Entra ID group membership",
        "S-Curve/EV dashboards from Fabric lakehouse data",
        "Project/WBS drill-down navigation from P6 data",
        "SharePoint Embedded file viewer integration",
      ],
      scope: "https://analysis.windows.net/powerbi/api/.default\nhttps://graph.microsoft.com/.default",
    },
    apim: {
      title: "Azure API Management",
      tech: "APIM Developer/Standard Tier",
      auth: "JWT validation + Entra ID group claims",
      details: [
        "API Gateway — single entry point for all backend calls",
        "Enforces RBAC at the gateway before hitting backend",
        "JWT validation policy validates Entra ID tokens",
        "Group-claim policies filter by project/WBS access",
        "Rate limiting, throttling, request validation",
        "API versioning and developer portal",
        "Centralized audit trail for all API requests",
        "Routes to backend aggregation service endpoints",
      ],
      scope: "Policy-based: validate-jwt, rate-limit, cors",
    },
    backend: {
      title: "Backend Aggregation Service",
      tech: "Azure Functions (Node.js) or Express",
      auth: "Multi-auth broker (MSAL + Basic Auth)",
      details: [
        "Data federation layer across all three sources",
        "Handles Entra ID tokens for SharePoint & Fabric",
        "Manages P6 basic auth credentials server-side",
        "Unified response model filtered by Project/WBS ID",
        "Azure Key Vault integration for credential storage",
        "Cross-source data correlation and aggregation",
        "Caching layer for frequently accessed P6 data",
        "Error handling and retry logic per data source",
      ],
      scope: "Unified /api/v1/projects/{id} endpoints",
    },
    sharepoint: {
      title: "SharePoint Embedded",
      tech: "Microsoft Graph API + File Storage Containers",
      auth: "Entra ID (delegated + application permissions)",
      details: [
        "Document management via Graph API file operations",
        "Container Type registration in SP Admin Center",
        "Delegated permissions for user file access",
        "Application permissions for container management",
        "WOPI integration for in-browser Office editing",
        "Project documents linked to P6 Project IDs",
        "Version history, co-authoring, metadata tagging",
        "FileStorageContainer.* Graph API scopes",
      ],
      scope: "FileStorageContainer.Selected\nFiles.ReadWrite.All",
    },
    fabric: {
      title: "Microsoft Fabric Lakehouse",
      tech: "Fabric Lakehouse + Dataflow Gen2 + Semantic Model",
      auth: "Entra ID (Power BI API scope)",
      details: [
        "STAR schema tables from Oracle PDW via Dataflow Gen2",
        "W_PROJECT_D, W_ACTIVITY_D, W_WBS_D dimensions",
        "W_ACTIVITY_SPREAD_F, W_WBS_SPREAD_F fact tables",
        "Semantic model with star schema relationships",
        "DAX measures for Cumulative PV, EV, AC, EAC",
        "Daily scheduled refresh from Oracle 19c STARDW",
        "54 projects, 3,674 activities, 5,523 assignments",
        "Power BI REST API for programmatic data access",
      ],
      scope: "https://analysis.windows.net/powerbi/api/.default",
    },
    p6: {
      title: "Primavera P6 EPPM 25",
      tech: "P6 REST API on WebLogic 14c (pi-p6-dev1)",
      auth: "Basic Authentication (separate from Entra ID)",
      details: [
        "P6 REST API: http://172.20.0.4:8203/p6ws/restapi",
        "Project, WBS, Activity, Resource endpoints",
        "Basic auth credentials stored in Azure Key Vault",
        "Backend service handles auth — never exposed client-side",
        "Real-time project schedule data and EV metrics",
        "Oracle 19c (SID: ORCL) on pi-ora19c-dev1:172.20.0.6",
        "STAR schema (STARDW) feeds Fabric lakehouse",
        "Publication Services → STARETL → Data Warehouse",
      ],
      scope: "Basic Auth: username:password (base64 encoded)",
    },
    entraid: {
      title: "Microsoft Entra ID",
      tech: "Identity Platform + App Registrations",
      auth: "OAuth 2.0 / OpenID Connect",
      details: [
        "Tenant: 149c7da5-cfb8-45f6-9073-20fedcde99cf",
        "App registrations for SPA + backend + SPE",
        "Group-based RBAC (project-level access control)",
        "Token scopes: Graph API, Fabric/Power BI, APIM",
        "Conditional Access policies for security",
        "Multi-tenant or single-tenant configuration",
        "Service principals for app-only operations",
        "Token caching and silent renewal via MSAL",
      ],
      scope: "openid profile email User.Read",
    },
    keyvault: {
      title: "Azure Key Vault",
      tech: "Azure Key Vault (Standard Tier)",
      auth: "Managed Identity access",
      details: [
        "Stores P6 basic auth credentials securely",
        "APIM certificate and secret management",
        "Backend service retrieves secrets at runtime",
        "Managed Identity eliminates stored credentials",
        "Rotation policies for P6 service account",
        "Audit logging for all secret access",
      ],
      scope: "Managed Identity: get/list secrets",
    },
  };

  const d = nodeDetails[node] || { title: node, tech: "", auth: "", details: [], scope: "" };
  const nodeColors = {
    react: colors.accent5, apim: colors.accent4, backend: "#6366f1",
    sharepoint: colors.accent1, fabric: colors.accent2, p6: colors.accent3,
    entraid: colors.accent6, keyvault: "#f43f5e",
  };
  const c = nodeColors[node] || colors.accent1;

  return (
    <div style={{
      background: "rgba(10, 14, 26, 0.97)", border: `1px solid ${c}40`,
      borderRadius: 16, padding: "24px 28px", marginTop: 16,
      borderTop: `3px solid ${c}`,
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 40px ${c}15`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: fontSans }}>{d.title}</div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fontMono, marginTop: 4 }}>{d.tech}</div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(71, 85, 105, 0.3)", border: `1px solid ${colors.border}`,
          borderRadius: 8, color: colors.textMuted, padding: "4px 12px", cursor: "pointer",
          fontSize: 11, fontFamily: fontMono,
        }}>✕ close</button>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: fontMono,
            letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" }}>Authentication</div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fontSans, lineHeight: 1.6,
            padding: "8px 12px", background: "rgba(30, 41, 59, 0.4)", borderRadius: 8,
            border: `1px solid ${colors.border}` }}>{d.auth}</div>

          <div style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: fontMono,
            letterSpacing: 1.2, marginBottom: 8, marginTop: 16, textTransform: "uppercase" }}>Scopes / Policies</div>
          <div style={{ fontSize: 10, color: colors.textDim, fontFamily: fontMono, lineHeight: 1.8,
            padding: "8px 12px", background: "rgba(30, 41, 59, 0.4)", borderRadius: 8,
            border: `1px solid ${colors.border}`, whiteSpace: "pre-wrap" }}>{d.scope}</div>
        </div>

        <div style={{ flex: 1.5, minWidth: 320 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: fontMono,
            letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" }}>Architecture Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {d.details.map((item, i) => (
              <div key={i} style={{
                fontSize: 11, color: colors.textMuted, fontFamily: fontSans, lineHeight: 1.5,
                padding: "4px 0", borderBottom: i < d.details.length - 1 ? `1px solid ${colors.line}` : "none",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ color: c, fontSize: 8, marginTop: 4 }}>▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──
export default function ProgramIntelArchitecture() {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode === node ? null : node);
  };

  return (
    <div style={{
      background: colors.bg,
      color: colors.text,
      fontFamily: fontSans,
      padding: "28px 32px",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(${colors.textDim} 1px, transparent 1px),
          linear-gradient(90deg, ${colors.textDim} 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: colors.text,
            fontFamily: fontSans, letterSpacing: -0.5 }}>Program Intel</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent4,
            fontFamily: fontMono, letterSpacing: 1.5, textTransform: "uppercase",
            padding: "2px 10px", border: `1px solid ${colors.accent4}40`, borderRadius: 4 }}>Architecture Blueprint</span>
        </div>
        <div style={{ fontSize: 11, color: colors.textDim, fontFamily: fontMono, letterSpacing: 0.3 }}>
          RBLCO Development Environment • Azure Subscription: 82a29a94-6b95-43ec-860b-7ee5bee8c50b • Resource Group: rg-rzpi-p6-dev01
        </div>
        <div style={{ fontSize: 10, color: colors.textDim, fontFamily: fontMono, marginTop: 4 }}>
          Click any component to view detailed architecture specifications
        </div>
      </div>

      {/* Architecture Diagram (SVG) */}
      <div style={{
        position: "relative", background: "rgba(15, 23, 42, 0.3)",
        border: `1px solid ${colors.border}`, borderRadius: 16,
        padding: 8, overflow: "auto",
      }}>
        <svg viewBox="0 0 1100 680" style={{ width: "100%", height: "auto", minWidth: 900 }}>
          <defs>
            <style>{`
              @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
              @keyframes flowRight {
                0% { stroke-dashoffset: 20; }
                100% { stroke-dashoffset: 0; }
              }
            `}</style>
          </defs>

          {/* ── ZONE: Client Tier ── */}
          <Zone x={30} y={30} w={200} h={160} label="CLIENT TIER" color={colors.accent5} sublabel="Browser" />

          {/* ── ZONE: Identity ── */}
          <Zone x={280} y={30} w={200} h={160} label="IDENTITY" color={colors.accent6} sublabel="Entra ID" />

          {/* ── ZONE: API Gateway ── */}
          <Zone x={530} y={30} w={240} h={160} label="API GATEWAY" color={colors.accent4} sublabel="Azure APIM" />

          {/* ── ZONE: Backend ── */}
          <Zone x={30} y={240} w={740} h={160} label="BACKEND SERVICES" color="#6366f1" sublabel="Azure Functions / Express" />

          {/* ── ZONE: Data Sources ── */}
          <Zone x={30} y={450} w={1040} h={200} label="DATA SOURCES" color="#f97316" sublabel="Multi-Auth" />

          {/* ── ZONE: Security ── */}
          <Zone x={820} y={30} w={250} h={370} label="SECURITY & SECRETS" color="#f43f5e" sublabel="Zero Trust" />

          {/* ══════ NODES ══════ */}

          {/* React SPA */}
          <ArchNode
            x={50} y={55} w={165} h={120}
            label="React SPA" sublabel="TypeScript + MSAL React"
            icon="⚛" color={colors.accent5}
            details={["@azure/msal-react", "Tailwind CSS", "Recharts / D3.js", "SharePoint Embedded SDK"]}
            onClick={() => handleNodeClick("react")}
            selected={selectedNode === "react"}
          />

          {/* Entra ID */}
          <ArchNode
            x={295} y={55} w={170} h={120}
            label="Entra ID" sublabel="OAuth 2.0 / OIDC"
            icon="🔐" color={colors.accent6}
            details={["JWT token issuance", "Group-based RBAC", "App registrations", "Conditional Access"]}
            onClick={() => handleNodeClick("entraid")}
            selected={selectedNode === "entraid"}
          />

          {/* APIM */}
          <ArchNode
            x={545} y={55} w={210} h={120}
            label="Azure API Mgmt" sublabel="Gateway + Policy Engine"
            icon="🛡" color={colors.accent4}
            details={["JWT validation policies", "Rate limiting / throttling", "RBAC enforcement", "API versioning & audit"]}
            onClick={() => handleNodeClick("apim")}
            selected={selectedNode === "apim"}
          />

          {/* Key Vault */}
          <ArchNode
            x={840} y={55} w={210} h={120}
            label="Azure Key Vault" sublabel="Managed Identity Access"
            icon="🔑" color="#f43f5e"
            details={["P6 credentials storage", "Certificate management", "Secret rotation", "Audit logging"]}
            onClick={() => handleNodeClick("keyvault")}
            selected={selectedNode === "keyvault"}
          />

          {/* Backend Aggregation Service */}
          <ArchNode
            x={50} y={270} w={700} h={110}
            label="Backend Aggregation Service" sublabel="Azure Functions (Node.js) — Data Federation Layer"
            icon="⚡" color="#6366f1"
            details={[
              "POST /api/v1/projects/{projectId}  →  Unified project data (P6 + Fabric + SharePoint)",
              "GET  /api/v1/wbs/{wbsId}/analytics  →  EV metrics from Fabric lakehouse semantic model",
              "GET  /api/v1/projects/{projectId}/documents  →  SharePoint Embedded file listing via Graph API",
            ]}
            onClick={() => handleNodeClick("backend")}
            selected={selectedNode === "backend"}
          />

          {/* ── DATA SOURCE NODES ── */}

          {/* SharePoint Embedded */}
          <ArchNode
            x={50} y={480} w={300} h={150}
            label="SharePoint Embedded" sublabel="Microsoft Graph API • File Storage Containers"
            icon="📄" color={colors.accent1}
            details={[
              "Auth: Entra ID (delegated + app)",
              "Scope: FileStorageContainer.Selected",
              "Project documents & deliverables",
              "WOPI for in-browser Office editing",
              "Container Type in SP Admin Center",
            ]}
            onClick={() => handleNodeClick("sharepoint")}
            selected={selectedNode === "sharepoint"}
          />

          {/* Fabric Lakehouse */}
          <ArchNode
            x={390} y={480} w={300} h={150}
            label="Fabric Lakehouse" sublabel="Dataflow Gen2 • Semantic Model • Power BI API"
            icon="💎" color={colors.accent2}
            details={[
              "Auth: Entra ID (Power BI scope)",
              "Source: STARDW → Dataflow Gen2",
              "54 projects • 3,674 activities",
              "S-Curve / EV / DAX measures",
              "Daily refresh from Oracle 19c",
            ]}
            onClick={() => handleNodeClick("fabric")}
            selected={selectedNode === "fabric"}
          />

          {/* Primavera P6 */}
          <ArchNode
            x={730} y={480} w={320} h={150}
            label="Primavera P6 EPPM 25" sublabel="P6 REST API • WebLogic 14c • pi-p6-dev1"
            icon="📊" color={colors.accent3}
            details={[
              "Auth: Basic (separate from Entra)",
              "Endpoint: 172.20.0.4:8203/p6ws",
              "Project, WBS, Activity, Resource",
              "Oracle 19c (SID: ORCL) 172.20.0.6",
              "STARETL → STARDW star schema",
            ]}
            onClick={() => handleNodeClick("p6")}
            selected={selectedNode === "p6"}
          />

          {/* ══════ CONNECTIONS ══════ */}

          {/* React → Entra ID (auth flow) */}
          <Arrow x1={215} y1={115} x2={295} y2={115}
            color={colors.accent6} label="OIDC / OAuth" />

          {/* React → APIM (API calls) */}
          <Arrow x1={215} y1={85} x2={545} y2={85}
            color={colors.accent4} label="Bearer Token + API Call" />

          {/* Entra ID → APIM (token validation) */}
          <Arrow x1={465} y1={115} x2={545} y2={115}
            color={colors.accent6} label="JWT Validation" dashed />

          {/* APIM → Backend */}
          <Arrow x1={650} y1={175} x2={500} y2={270}
            color={colors.accent4} label="Validated Request" />

          {/* APIM → Key Vault */}
          <Arrow x1={755} y1={100} x2={840} y2={100}
            color="#f43f5e" label="Secrets" dashed />

          {/* Backend → Key Vault */}
          <Arrow x1={750} y1={325} x2={945} y2={175}
            color="#f43f5e" label="P6 Creds" dashed />

          {/* Backend → SharePoint */}
          <Arrow x1={200} y1={380} x2={200} y2={480}
            color={colors.accent1} label="Graph API / MSAL" />

          {/* Backend → Fabric */}
          <Arrow x1={400} y1={380} x2={540} y2={480}
            color={colors.accent2} label="Power BI REST / MSAL" />

          {/* Backend → P6 */}
          <Arrow x1={600} y1={380} x2={890} y2={480}
            color={colors.accent3} label="Basic Auth (from KV)" />

          {/* P6 DB connection indicator */}
          <line x1={890} y1={630} x2={890} y2={655}
            stroke={colors.accent3} strokeWidth={1} opacity={0.4} strokeDasharray="3 3" />
          <text x={890} y={668} fontSize={8} fill={colors.textDim} textAnchor="middle"
            fontFamily={fontMono}>Oracle 19c (ORCL) → STARDW → Dataflow Gen2</text>

          {/* Fabric ↔ P6 data pipeline indicator */}
          <Arrow x1={690} y1={555} x2={730} y2={555}
            color="#f97316" label="ETL Pipeline" dashed bidirectional />

        </svg>
      </div>

      {/* Detail Panel */}
      <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />

      {/* Data Flow Summary */}
      <div style={{
        display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap",
      }}>
        {/* Auth Flow */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(15, 23, 42, 0.5)", border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.accent6,
            fontFamily: fontMono, letterSpacing: 1.2, marginBottom: 10,
            textTransform: "uppercase",
          }}>Authentication Flow</div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fontSans, lineHeight: 1.8 }}>
            <div><span style={{ color: colors.accent5 }}>1.</span> User authenticates via MSAL React → Entra ID</div>
            <div><span style={{ color: colors.accent5 }}>2.</span> Entra ID issues JWT with group claims</div>
            <div><span style={{ color: colors.accent5 }}>3.</span> React SPA sends Bearer token to APIM</div>
            <div><span style={{ color: colors.accent5 }}>4.</span> APIM validates JWT + enforces RBAC policies</div>
            <div><span style={{ color: colors.accent5 }}>5.</span> Backend acquires downstream tokens (MSAL for SP/Fabric)</div>
            <div><span style={{ color: colors.accent5 }}>6.</span> Backend retrieves P6 creds from Key Vault (Basic Auth)</div>
          </div>
        </div>

        {/* Data Pipeline */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(15, 23, 42, 0.5)", border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.accent2,
            fontFamily: fontMono, letterSpacing: 1.2, marginBottom: 10,
            textTransform: "uppercase",
          }}>Data Pipeline</div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fontSans, lineHeight: 1.8 }}>
            <div><span style={{ color: colors.accent3 }}>P6 EPPM</span> → Publication Services → Extended Schema</div>
            <div><span style={{ color: colors.accent3 }}>STARETL</span> → STARDW star schema (Oracle 19c)</div>
            <div><span style={{ color: colors.accent2 }}>Dataflow Gen2</span> → Fabric Lakehouse (daily refresh)</div>
            <div><span style={{ color: colors.accent2 }}>Semantic Model</span> → DAX measures (PV, EV, AC, EAC)</div>
            <div><span style={{ color: colors.accent1 }}>Graph API</span> → SharePoint Embedded containers</div>
            <div><span style={{ color: "#6366f1" }}>Backend</span> → Unified response by Project/WBS ID</div>
          </div>
        </div>

        {/* Infrastructure */}
        <div style={{
          flex: 1, minWidth: 280,
          background: "rgba(15, 23, 42, 0.5)", border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.accent3,
            fontFamily: fontMono, letterSpacing: 1.2, marginBottom: 10,
            textTransform: "uppercase",
          }}>Azure Infrastructure</div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: fontMono, lineHeight: 1.9 }}>
            <div><span style={{ color: colors.accent3 }}>pi-ora19c-dev1</span> 172.20.0.6 Oracle 19c (ORCL)</div>
            <div><span style={{ color: colors.accent3 }}>pi-p6-dev1</span>     172.20.0.4 P6 EPPM 25 + WLS 14c</div>
            <div><span style={{ color: colors.accent3 }}>pi-oas-dev1</span>    172.20.0.8 OAS + PDW + Analytics</div>
            <div style={{ marginTop: 6, borderTop: `1px solid ${colors.border}`, paddingTop: 6 }}>
              <span style={{ color: colors.textDim }}>VNet: 172.20.0.0/24 • P2S VPN</span>
            </div>
            <div><span style={{ color: colors.textDim }}>NSG: vm-pi-p6-dev01-nsg</span></div>
            <div><span style={{ color: colors.textDim }}>Non-CDB • SID: ORCL • STARDW schema</span></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 20, padding: "12px 0", borderTop: `1px solid ${colors.line}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: "#1e293b", fontSize: 10, fontFamily: fontMono }}>
          RBLCO • Program Intel Architecture Blueprint • February 2026
        </span>
        <span style={{ color: "#1e293b", fontSize: 10, fontFamily: fontMono }}>
          React SPA → APIM → Backend Aggregation → SharePoint Embedded + Fabric Lakehouse + P6 EPPM
        </span>
      </div>
    </div>
  );
}
