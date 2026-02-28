import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import VinResultCard from "./VinResult.jsx";

export default function MultiVinInput({ vins, setVins }) {
  const [results, setResults] = useState({});

  const handleVinChange = (index, value) => {
    const newVins = [...vins];
    newVins[index] = value;
    setVins(newVins);
  };

  const addVinField = () => {
    setVins([...vins, ""]);
  };

  const removeVinField = (index) => {
    setVins(vins.filter((_, i) => i !== index));
  };

  const mapApiResult = (data) => {
    const mapped = {};
    data.Results?.forEach((item) => {
      if (item.Value !== null && item.Value !== "") {
        mapped[item.Variable] = item.Value;
      }
    });
    return mapped;
  };

  const saveToRecentVins = async (vin) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const recentVins = userSnap.data().recentlyUsedVins || [];

      // Add to front and keep only last 10
      let updated = [vin, ...recentVins.filter(v => v !== vin)];
      if (updated.length > 10) updated = updated.slice(0, 10);

      await updateDoc(userRef, {
        recentlyUsedVins: updated,
      });
    } catch (error) {
      console.error("Error saving to recent VINs:", error);
    }
  };

  const decodeAllVins = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to decode VINs.");
      return;
    }

    const validVins = vins.filter((v) => v.trim().length === 17);
    if (validVins.length === 0) {
      alert("Please enter at least one valid 17-digit VIN.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User profile not found.");
        return;
      }

      const availableCredits = userSnap.data().credits || 0;
      if (availableCredits <= 0) {
        alert("❌ You have 0 credits left. Please top up to continue.");
        return;
      }

      await updateDoc(userRef, {
        credits: increment(-1),
      });

      const newResults = { ...results };

      for (const vin of validVins) {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
        );
        const data = await res.json();
        const mappedData = mapApiResult(data);

        newResults[vin] = mappedData;
        await saveToRecentVins(vin);

        // 🔹 NEW: Save to Firestore for Auto-Monitoring
        await saveVehicleForMonitoring(user.uid, vin, mappedData);
      }

      setResults(newResults);
      alert("✅ 1 Credit deducted. VINs decoded and added to Auto-Monitor!");
      
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Check your connection.");
    }
  };

  // 🔹 NEW HELPER FUNCTION
  const saveVehicleForMonitoring = async (userId, vin, vehicleData) => {
    try {
      // Document ID is vin_userId to prevent duplicates for the same user
      const vehicleRef = doc(db, "vehicles", `${vin}_${userId}`);
      
      await setDoc(vehicleRef, {
        userId: userId,
        vin: vin,
        make: vehicleData["Make"] || "Unknown",
        model: vehicleData["Model"] || "Unknown",
        year: vehicleData["Model Year"] || "Unknown",
        lastCheckedAt: serverTimestamp(),
        // We initialize this as an empty array; 
        // Cloud functions will fill this with IDs of recalls already handled.
        processedRecallIds: [], 
      }, { merge: true }); // merge: true prevents overwriting other fields if they exist
    } catch (err) {
      console.error("Failed to save to monitor:", err);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").map(line => line.trim()).filter(line => line);
      const uploadedVins = lines.filter(vin => vin.length === 17);
      setVins([...vins, ...uploadedVins]);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Multi-VIN Decoder</h2>
      
      {/* VIN INPUT FIELDS */}
      <div style={{ marginBottom: "20px" }}>
        {vins.map((vin, index) => (
          <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={vin}
              onChange={(e) => handleVinChange(index, e.target.value.toUpperCase())}
              placeholder={`VIN ${index + 1} (17 characters)`}
              maxLength="17"
              style={{ flex: 1, padding: "8px", fontSize: "14px" }}
            />
            <button
              onClick={() => removeVinField(index)}
              style={{ padding: "8px 12px", backgroundColor: "#d9534f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button
          onClick={addVinField}
          style={{ padding: "10px 15px", backgroundColor: "#5cb85c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          + Add VIN
        </button>
        <button
          onClick={decodeAllVins}
          style={{ padding: "10px 15px", backgroundColor: "#0275d8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Decode All VINs
        </button>
        <label style={{ padding: "10px 15px", backgroundColor: "#f0ad4e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", display: "inline-block" }}>
          Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* RESULTS */}
      <div>
        {Object.entries(results).map(([vin, result]) => (
          <VinResultCard key={vin} vin={vin} result={result} />
        ))}
      </div>
    </div>
  );
}
