import { useState, useRef } from "react";
import jsPDF from "jspdf";

export default function VinResultCard({ vin, result }) {
  const [showAdditional, setShowAdditional] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showRecalls, setShowRecalls] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);
  const containerRef = useRef(null);

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

  // Generate PDF of the visible VIN result area
  const generatePDF = async () => {
    if (!containerRef?.current) {
      alert("Nothing to print.");
      return;
    }

    const el = containerRef.current;
    // Backup inline styles we will override so we can restore them
    const oldStyle = el.getAttribute("style") || "";

    // Use true A4 proportions (root2:1). A4 width in points is ~595.28pt.
    // Convert points to CSS pixels assuming 96dpi (1pt = 96/72 px).
    const PT_TO_PX = 96 / 72;
    const A4_PT_WIDTH = 595.28;
    const horizontalMarginPT = 40; // keep 20pt each side when rendering
    const contentWidthPT = A4_PT_WIDTH - horizontalMarginPT; // 555.28pt
    const contentWidthPx = Math.round(contentWidthPT * PT_TO_PX);

    // Constrain element to A4 content width in CSS pixels so html2canvas maps correctly
    el.style.boxSizing = "border-box";
    el.style.width = `${contentWidthPx}px`;
    el.style.maxWidth = `${contentWidthPx}px`;
    el.style.wordBreak = "break-word";
    el.style.overflowWrap = "break-word";

    // Adjust children that commonly overflow
    const imgs = el.querySelectorAll("img");
    const pres = el.querySelectorAll("pre, code");
    const tables = el.querySelectorAll("table");

    const imgOld = [];
    imgs.forEach((img) => {
      imgOld.push(img.getAttribute("style") || "");
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    });

    const preOld = [];
    pres.forEach((p) => {
      preOld.push(p.getAttribute("style") || "");
      p.style.whiteSpace = "pre-wrap";
      p.style.wordBreak = "break-word";
    });

    const tableOld = [];
    tables.forEach((t) => {
      tableOld.push(t.getAttribute("style") || "");
      t.style.width = "100%";
      t.style.tableLayout = "fixed";
      t.style.wordBreak = "break-word";
    });

    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      await pdf.html(el, {
        callback: (doc) => doc.save(`${vin || "vin"}_view.pdf`),
        x: 20,
        y: 20,
        // match html2canvas width to our constrained element so output maps to A4
        windowWidth: el.clientWidth || document.documentElement.clientWidth,
        html2canvas: { scale: 1.2, useCORS: true, backgroundColor: "#ffffff" },
      });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Could not generate PDF.");
    } finally {
      // restore original inline styles
      if (oldStyle) el.setAttribute("style", oldStyle);
      else el.removeAttribute("style");

      imgs.forEach((img, i) => {
        if (imgOld[i]) img.setAttribute("style", imgOld[i]); else img.removeAttribute("style");
      });
      pres.forEach((p, i) => {
        if (preOld[i]) p.setAttribute("style", preOld[i]); else p.removeAttribute("style");
      });
      tables.forEach((t, i) => {
        if (tableOld[i]) t.setAttribute("style", tableOld[i]); else t.removeAttribute("style");
      });
    }
  };

  return (
    <>
    <div ref={containerRef} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
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

        <button 
          onClick={() => { setShowSafety(!showSafety); fetchSafety(); }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          🛡️ View Safety Info
        </button>

        <button 
          onClick={() => { setShowRecalls(!showRecalls); fetchRecalls(); }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#ffc107",
            color: "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          ⚠️ View Recall Info
        </button>

        <button 
          onClick={() => { setShowComplaints(!showComplaints); fetchComplaints(); }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          📋 View Complaints
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
        <div style={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #2196f3",
          borderRadius: "4px",
          padding: "15px",
          marginTop: "15px"
        }}>
          <h4>🛡️ Safety Ratings</h4>
          {safetyData?.length ? (
            safetyData.map((s, i) => (
              <div key={i} style={{
                backgroundColor: "white",
                padding: "10px",
                marginTop: "10px",
                borderRadius: "4px",
                borderLeft: "4px solid #2196f3"
              }}>
                <p><strong>{s.VehicleDescription}</strong></p>
                {s.OverallRating && <p>Overall Rating: ⭐ {s.OverallRating}/5</p>}
              </div>
            ))
          ) : (
            <p>No safety ratings found.</p>
          )}
        </div>
      )}

      {/* RECALLS */}
      {showRecalls && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "4px",
          padding: "15px",
          marginTop: "15px"
        }}>
          <h4>⚠️ Recalls</h4>
          {recallData?.length ? (
            recallData.map((r, i) => (
              <div key={i} style={{
                backgroundColor: "white",
                padding: "10px",
                marginTop: "10px",
                borderRadius: "4px",
                borderLeft: "4px solid #ffc107"
              }}>
                <p><strong>Component:</strong> {r.Component}</p>
                <p><strong>Summary:</strong> {r.Summary}</p>
                {r.Consequence && <p><strong>Consequence:</strong> {r.Consequence}</p>}
                {r.Remedy && <p><strong>Remedy:</strong> {r.Remedy}</p>}
              </div>
            ))
          ) : (
            <p>No recalls found.</p>
          )}
        </div>
      )}

      {/* COMPLAINTS */}
      {showComplaints && (
        <div style={{
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          padding: "15px",
          marginTop: "15px"
        }}>
          <h4>📋 Complaints</h4>
          {complaintData?.length ? (
            <>
              {(showAllComplaints
                ? complaintData
                : complaintData.slice(0, 5)
              ).map((c, i) => (
                <div key={i} style={{
                  backgroundColor: "white",
                  padding: "10px",
                  marginTop: "10px",
                  borderRadius: "4px",
                  borderLeft: "4px solid #f5c6cb"
                }}>
                  <p>{c.complaintSummary || c.summary || "No details available"}</p>
                </div>
              ))}
              {complaintData.length > 5 && (
                <button
                  onClick={() => setShowAllComplaints(!showAllComplaints)}
                  style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {showAllComplaints ? "Show less" : `Show all (${complaintData.length})`}
                </button>
              )}
            </>
          ) : (
            <p>No complaints found.</p>
          )}
        </div>
      )}

    </div>
    <div style={{ textAlign: "right", marginTop: "8px" }}>
      <button
        onClick={generatePDF}
        style={{
          padding: "8px 12px",
          backgroundColor: "#2f4858",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        📄 Download Response as PDF
      </button>
    </div>
    </>
  );
}
