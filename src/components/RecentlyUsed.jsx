import { useEffect, useState } from "react";

export default function RecentlyUsed({ onSelectVin }) {
  const [recentVins, setRecentVins] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recent_vins")) || [];
    setRecentVins(stored);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("recent_vins");
    setRecentVins([]);
  };

  return (
    <div
      style={{
        width: "250px",
        background: "#f5f5f5",
        padding: "15px",
        borderRadius: "8px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>Recently Used</h3>

        {recentVins.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: "red",
              color: "white",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {recentVins.length === 0 && (
        <p style={{ fontSize: "14px", color: "#666" }}>No VIN history yet.</p>
      )}

      {recentVins.map((vin, index) => (
        <p
          key={index}
          onClick={() => onSelectVin(vin)}
          style={{
            cursor: "pointer",
            background: "#fff",
            padding: "8px",
            marginTop: "6px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          {vin}
        </p>
      ))}
    </div>
  );
}
