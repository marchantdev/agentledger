import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Verify from "./pages/Verify";
import RecordDemo from "./pages/RecordDemo";
import Receipt from "./pages/Receipt";
import Workbench from "./pages/Workbench";
import About from "./pages/About";
import DisputeCaseFile from "./pages/DisputeCaseFile";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — no sidebar, standalone marketing page */}
        <Route path="/" element={<Landing />} />

        {/* App pages — wrapped in sidebar + header layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/record" element={<RecordDemo />} />
          <Route path="/receipt/:id" element={<Receipt />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/dispute" element={<DisputeCaseFile />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
