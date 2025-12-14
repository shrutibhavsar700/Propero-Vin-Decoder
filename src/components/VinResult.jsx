import { useState } from "react";
import jsPDF from "jspdf";

export default function VinResultCard({ vin, result }) {
  const [showAdditional, setShowAdditional] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showRecalls, setShowRecalls] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);

  const [safetyData, setSafetyData] = useState(null);
  const [recallData, setRecallData] = useState(null);
  const [complaintData, setComplaintData] = useState(null);

  const [showAllComplaints, setShowAllComplaints] = useState(false);

  if (!result) return null;

  const basicInfo = {
    Make: result.Make,
    Model: result.Model,
    Year: result["Model Year"],
  };

  /* ---------------------- FETCH EXTRA DATA ---------------------- */

  const fetchSafety = async () => {
    if (safetyData) return; // already fetched
    const res = await fetch(
      `https://api.nhtsa.gov/SafetyRatings/modelyear/${basicInfo.Year}/make/${basicInfo.Make}/model/${basicInfo.Model}`
    );
    const data = await res.json();
    setSafetyData(data.Results || []);
  };

  const fetchRecalls = async () => {
    if (recallData) return;
    const res = await fetch(
      `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${basicInfo.Make}&model=${basicInfo.Model}&modelYear=${basicInfo.Year}`
    );
    const data = await res.json();
    setRecallData(data.results || []);
  };

  const fetchComplaints = async () => {
    if (complaintData) return;
    const res = await fetch(
      `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${basicInfo.Make}&model=${basicInfo.Model}&modelYear=${basicInfo.Year}`
    );
    const data = await res.json();
    setComplaintData(data.results || []);
  };

  /* ---------------------- EXPORTS (UNCHANGED) ---------------------- */

  const exportCSV = () => {
    const rows = [["Field", "Value"]];
    Object.entries(result).forEach(([key, val]) =>
      rows.push([key, val || "N/A"])
    );
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${vin}_decoded.csv`;
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`VIN Report: ${vin}`, 10, 15);
    let y = 30;
    Object.entries(result).forEach(([k, v]) => {
      doc.text(`${k}: ${v || "N/A"}`, 10, y);
      y += 7;
    });
    doc.save(`${vin}_decoded.pdf`);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
      <h3>VIN: {vin}</h3>

      {/* BASIC INFO */}
      {Object.entries(basicInfo).map(([k, v]) => (
        <p key={k}><strong>{k}:</strong> {v || "N/A"}</p>
      ))}

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => setShowAdditional(!showAdditional)}>
          View Additional Info
        </button>

        <button onClick={() => { setShowSafety(!showSafety); fetchSafety(); }}>
          View Safety Info
        </button>

        <button onClick={() => { setShowRecalls(!showRecalls); fetchRecalls(); }}>
          View Recall Info
        </button>

        <button onClick={() => { setShowComplaints(!showComplaints); fetchComplaints(); }}>
          View Complaints
        </button>
      </div>

      {/* ADDITIONAL INFO */}
      {showAdditional && (
        <div>
          {Object.entries(result).map(([k, v]) => (
            <p key={k}><strong>{k}:</strong> {v || "N/A"}</p>
          ))}
        </div>
      )}

      {/* SAFETY */}
      {showSafety && (
        <div>
          {safetyData?.length
            ? safetyData.map((s, i) => (
                <p key={i}>{s.VehicleDescription}</p>
              ))
            : <p>No safety ratings found.</p>}
        </div>
      )}

      {/* RECALLS */}
      {showRecalls && (
        <div>
          {recallData?.length
            ? recallData.map((r, i) => (
                <p key={i}><strong>{r.Component}:</strong> {r.Summary}</p>
              ))
            : <p>No recalls found.</p>}
        </div>
      )}

      {/* COMPLAINTS */}
      {/* COMPLAINTS */}
{showComplaints && (
  <div style={{ marginTop: "15px" }}>
    <h4>Complaints</h4>

    {complaintData?.length ? (
      <>
        {(showAllComplaints
          ? complaintData
          : complaintData.slice(0, 5) // ✅ CHANGED: limit to first 5
        ).map((c, i) => (
          <p key={i} style={{ fontSize: "14px" }}>
            • {c.complaintSummary || c.summary || "No details available"}
          </p>
        ))}

        {complaintData.length > 5 && (
          <button
            onClick={() => setShowAllComplaints(!showAllComplaints)}
            style={{ marginTop: "8px" }}
          >
            {showAllComplaints ? "Hide complaints" : "Show all complaints"}
          </button>
        )}
      </>
    ) : (
      <p>No complaints found.</p>
    )}
  </div>
)}

    </div>
  );
}
