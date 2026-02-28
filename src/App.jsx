import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import MultiVinInput from "./components/MultiVin.jsx";
import VehicleBrowser from "./components/VehicleBrowser.jsx";
import RecentlyUsed from "./components/RecentlyUsed.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Auth from "./components/Auth.jsx";
import UserProfile from "./components/UserProfile.jsx"; 

import "./firebase";

function App() {
  const [vins, setVins] = useState([""]);
  const [stage, setStage] = useState("landing"); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  // stages: landing → auth → app

  const handleSelectVinFromHistory = (vin) => {
    setVins((prev) => [...prev, vin]);
  };

  return (
    <Router>
      {/* 🔹 LANDING */}
      {stage === "landing" && (
        <LandingPage onFinish={() => setStage("auth")} />
      )}

      {/* 🔹 AUTH */}
      {stage === "auth" && (
        <Auth onAuthSuccess={() => setStage("app")} />
      )}

      {/* 🔹 MAIN APP */}
      {stage === "app" && (
        <div style={{ margin: 0, padding: 0 }}>
          {/* NAV BAR */}
          <motion.nav
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              backgroundColor: "#1d3557",
              width: "100%",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              padding: "15px 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "60px",
            }}
          >
            <Link style={navStyle} to="/">
              VIN Decoder
            </Link>
            <Link style={navStyle} to="/browser">
              Vehicle Browser
            </Link>

            {/* 🔹 PROFILE ICON DROPDOWN SECTION */}
            <div style={{ position: "absolute", right: "40px" }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={profileIconStyle}
              >
                👤
              </motion.div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={dropdownWrapper}
                  >
                    <UserProfile />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.nav>

          {/* CONTENT */}
          <div style={{ display: "flex", padding: "20px", gap: "30px" }}>
            {/* SIDEBAR */}
            <div style={sidebarStyle}>
              <RecentlyUsed onSelectVin={handleSelectVinFromHistory} />
            </div>

            {/* MAIN */}
            <div style={{ flex: 1 }}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <MultiVinInput vins={vins} setVins={setVins} />
                  }
                />
                <Route path="/browser" element={<VehicleBrowser />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

/* ---------------- STYLES ---------------- */

const navStyle = {
  color: "white",
  fontSize: "20px",
  fontWeight: 600,
  textDecoration: "none",
};

const profileIconStyle = {
  width: "35px",
  height: "35px",
  borderRadius: "50%",
  backgroundColor: "#457b9d",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  fontSize: "18px",
  border: "1px solid white",
};

const dropdownWrapper = {
  position: "absolute",
  top: "50px",
  right: "0",
  zIndex: 1001,
};

const sidebarStyle = {
  width: "250px",
  background: "#f8f9fa",
  padding: "20px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};

export default App;