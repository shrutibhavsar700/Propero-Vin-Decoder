import { useState } from "react";
import jsPDF from "jspdf";

export default function VinResultCard({ vin, result }) {
  const [showMore, setShowMore] = useState(false);

  if (!result) return null;

  const basicInfo = {
    Make: result.Make,
    Model: result.Model,
    Year: result["Model Year"],
  };

  /* ---------------------- EXPORT TO CSV ---------------------- */
  const exportCSV = () => {
    const rows = [["Field", "Value"]];

    Object.entries(result).forEach(([key, val]) => {
      rows.push([key, val || "N/A"]);
    });

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${vin}_decoded.csv`;
    link.click();
  };

  /* ---------------------- EXPORT TO PDF ---------------------- */
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`VIN Report: ${vin}`, 10, 15);

    doc.setFontSize(12);

    let y = 30;
    Object.entries(result).forEach(([key, val]) => {
      doc.text(`${key}: ${val || "N/A"}`, 10, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${vin}_decoded.pdf`);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "15px",
        background: "#fafafa",
        marginTop: "10px",
        color: "#555",
      }}
    >
      {/* ---------------- HEADER WITH EXPORT BUTTONS ---------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>VIN: {vin}</h3>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={exportCSV}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              background: "#6c757d",
              color: "white",
              cursor: "pointer",
              border: "none",
            }}
          >
            CSV
          </button>

          <button
            onClick={exportPDF}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              background: "#dc3545",
              color: "white",
              cursor: "pointer",
              border: "none",
            }}
          >
            PDF
          </button>
        </div>
      </div>

      {/* BASIC INFO */}
      <div style={{ marginTop: "8px" }}>
        {Object.entries(basicInfo).map(([key, val]) => (
          <p key={key}>
            <strong>{key}: </strong>
            {val || "N/A"}
          </p>
        ))}
      </div>

      {/* SHOW MORE */}
      {showMore && (
        <div style={{ marginTop: "10px" }}>
          {Object.entries(result).map(([key, val]) => {
            if (basicInfo[key] !== undefined) return null;
            return (
              <p key={key}>
                <strong>{key}: </strong>
                {val || "N/A"}
              </p>
            );
          })}
        </div>
      )}

      {/* TOGGLE */}
      <button
        onClick={() => setShowMore(!showMore)}
        style={{
          marginTop: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          background: "#007bff",
          color: "white",
          border: "none",
        }}
      >
        {showMore ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}
