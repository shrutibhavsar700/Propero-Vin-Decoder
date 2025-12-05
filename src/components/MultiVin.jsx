import { useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import VinResultCard from "./VinResult.jsx";

export default function MultiVinInput({ vins, setVins }) {
  const [results, setResults] = useState({});

  const handleVinChange = (index, value) => {
    const updated = [...vins];
    updated[index] = value.toUpperCase();
    setVins(updated);
  };

  const addVinField = () => setVins([...vins, ""]);

  const removeVinField = (index) => {
    const vinText = vins[index];
    const filtered = vins.filter((_, i) => i !== index);
    setVins(filtered);

    const updatedResults = { ...results };
    delete updatedResults[vinText];
    setResults(updatedResults);
  };

  function mapApiResult(apiData) {
    const mapped = {};
    apiData.Results.forEach((item) => {
      if (item.Variable) {
        mapped[item.Variable] = item.Value || "N/A";
      }
    });
    return mapped;
  }

  // FIXED VERSION
  const decodeAllVins = async () => {
  const newResults = {};

  for (const vin of vins) {
    if (vin.trim() === "") continue;

    if (vin.length !== 17) {
      alert(`❌ Invalid VIN: ${vin}`);
      continue;
    }

    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    );
    const data = await res.json();

    newResults[vin] = mapApiResult(data);

    // ✅ Save to history
    saveToRecentVins(vin);
  }

  setResults(newResults);
};




  const saveToRecentVins = (vin) => {
    let stored = JSON.parse(localStorage.getItem("recent_vins")) || [];
    stored = [vin, ...stored.filter((v) => v !== vin)].slice(0, 10);
    localStorage.setItem("recent_vins", JSON.stringify(stored));
  };

  const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => {
      const extractedVins = results.data.map((row) => row[0]?.trim());

      // Filter out invalid/short values
      const cleaned = extractedVins.filter((v) => v && v.length > 0);

      // Append to existing VINs in UI
      setVins((prev) => [...prev, ...cleaned]);
    },
  });
};


  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", paddingLeft: "100px" }}>
      <h2>VIN Decoder (Multiple VINs)</h2>

      {vins.map((vin, index) => (
        <div
          key={index}
          style={{
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* INPUT WITH FRAMER MOTION */}
          <motion.input
            type="text"
            placeholder={`Enter VIN #${index + 1}`}
            value={vin}
            onChange={(e) => handleVinChange(index, e.target.value)}
            whileHover={{ scale: 1.03 }}
            whileFocus={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          {vins.length > 1 && (
            <motion.span
              onClick={() => removeVinField(index)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                fontSize: "20px",
                color: "red",
              }}
            >
              ✖
            </motion.span>
          )}
        </div>
      ))}

      {/* CSV Upload */}
{/* <motion.div
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  style={{ marginBottom: "20px" }}
>
  <input
    type="file"
    accept=".csv"
    onChange={handleCsvUpload}
    style={{
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      cursor: "pointer",
      width: "100%",
    }}
  />
</motion.div> */}


      {/* ADD VIN BUTTON */}
      <motion.button
        onClick={addVinField}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200 }}
        style={{
          padding: "10px 15px",
          fontSize: "16px",
          cursor: "pointer",
          background: "#007bff",
          color: "white",
          borderRadius: "5px",
        }}
      >
        + Add Another VIN
      </motion.button>

      <br /><br />

      {/* DECODE BUTTON */}
      <motion.button
        onClick={decodeAllVins}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 200 }}
        style={{
          padding: "12px 18px",
          fontSize: "17px",
          background: "green",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Decode All VINs
      </motion.button>

      <hr style={{ margin: "30px 0" }} />

      {Object.keys(results).map((vin) => (
        <VinResultCard key={vin} vin={vin} result={results[vin]} />
      ))}
    </div>
  );
}
