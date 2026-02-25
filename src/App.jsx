import "./App.css";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import ProgramIntelArchitecture from "./pages/pi-architecture.jsx";
import SCurveDashboard from "./pages/dashboards/ev-dashboard.jsx";

function HomePage() {
  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">pubWeb</p>
        <h1>Pages are wired and ready.</h1>
        <p>
          Use these routes:
        </p>
        <ul className="route-list">
          <li>
            <Link to="/pi-architecture">/pi-architecture</Link>
          </li>
          <li>
            <Link to="/dashboards/ev-dashboard">/dashboards/ev-dashboard</Link>
          </li>
        </ul>
      </header>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pi-architecture" element={<ProgramIntelArchitecture />} />
        <Route path="/dashboards/ev-dashboard" element={<SCurveDashboard />} />
        <Route path="/ev-dashboard" element={<SCurveDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
