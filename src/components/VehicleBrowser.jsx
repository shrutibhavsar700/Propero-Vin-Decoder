import React, { useState } from "react";
import { motion } from "framer-motion";

const VehicleBrowser = () => {
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState({});
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingModelFor, setLoadingModelFor] = useState(null);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);

    try {
      const res = await fetch(
        "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
      );

      const data = await res.json();

      if (data?.Results?.length > 0) {
        const sorted = data.Results.sort((a, b) =>
          a.MakeName.localeCompare(b.MakeName)
        );
        setCompanies(sorted);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }

    setLoadingCompanies(false);
  };

  const fetchModels = async (makeId) => {
    setLoadingModelFor(makeId);
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${makeId}?format=json`
      );
      const data = await res.json();

      setModels((prev) => ({
        ...prev,
        [makeId]: data.Results,
      }));
    } catch (err) {
      console.error("Model fetch failed:", err);
    }

    setLoadingModelFor(null);
  };

  return (
    <div style={{ padding: "20px", paddingLeft: "300px" }}>

      {/* POP BUTTON */}
      <motion.button
        onClick={fetchCompanies}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        style={{
          padding: "10px 20px",
          background: "#1d3557",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        View Companies
      </motion.button>

      {loadingCompanies && <p>Loading companies...</p>}

      <div style={{ marginTop: "20px" }}>
        {companies.map((company) => (
          <motion.div
            key={company.MakeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            style={{ marginBottom: "12px" }}
          >
            {/* POP COMPANY BUTTON */}
            <motion.button
              onClick={() => fetchModels(company.MakeId)}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              style={{
                background: "#457b9d",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {company.MakeName}
            </motion.button>

            <div style={{ marginLeft: "20px", marginTop: "5px" }}>
              {loadingModelFor === company.MakeId && <p>Loading models...</p>}

              {models[company.MakeId] && (
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {models[company.MakeId].map((model) => (
                    <motion.li
                      key={model.Model_ID || model.ModelId}
                      whileHover={{ scale: 1.04 }}
                      style={{
                        padding: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {model.Model_Name || model.ModelName}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VehicleBrowser;
