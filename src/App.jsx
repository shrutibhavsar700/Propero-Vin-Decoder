import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion } from "framer-motion";

import MultiVinInput from "./components/MultiVin.jsx";
import VinResultCard from "./components/VinResult.jsx";
import VehicleBrowser from "./components/VehicleBrowser.jsx";
import RecentlyUsed from "./components/RecentlyUsed.jsx";
import LandingPage from "./components/LandingPage.jsx";

function App() {
  const [vins, setVins] = useState([]);

  const handleSelectVinFromHistory = (vin) => {
  setVins(prev => [...prev, vin]);  // ✅ append selected VIN to existing list
};

const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onFinish={() => setShowLanding(false)} />;
  }


  return (
    <Router>
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
            gap: "60px",
          }}
        >
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link style={{ color: "white", fontSize: "20px", fontWeight: 600 }} to="/">
              VIN Decoder
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }}>
            <Link style={{ color: "white", fontSize: "20px", fontWeight: 600 }} to="/browser">
              Vehicle Browser
            </Link>
          </motion.div>
        </motion.nav>

        {/* PAGE CONTENT */}
        <div style={{ display: "flex", padding: "20px", gap: "30px" }}>

          {/* SIDEBAR */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: "250px",
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          >
            <RecentlyUsed onSelectVin={handleSelectVinFromHistory} />
          </motion.div>

          {/* MAIN CONTENT */}
          <motion.div
            style={{ flex: 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Routes>
              <Route
                path="/"
                element={<MultiVinInput vins={vins} setVins={setVins} />}
              />
              <Route path="/browser" element={<VehicleBrowser />} />
            </Routes>
          </motion.div>
        </div>
      </div>
    </Router>
  );
}

export default App;
