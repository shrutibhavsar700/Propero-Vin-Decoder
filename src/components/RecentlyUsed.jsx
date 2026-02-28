import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

export default function RecentlyUsed({ onSelectVin }) {
  const [recentVins, setRecentVins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentVins = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const recentVinsData = userSnap.data().recentlyUsedVins || [];
          setRecentVins(recentVinsData);
        }
      } catch (error) {
        console.error("Error fetching recent VINs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentVins();
  }, []);

  const clearHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        recentlyUsedVins: [],
      });

      setRecentVins([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const removeVin = async (vin) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        recentlyUsedVins: arrayRemove(vin),
      });

      setRecentVins(recentVins.filter(v => v !== vin));
    } catch (error) {
      console.error("Error removing VIN:", error);
    }
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

      {loading && (
        <p style={{ fontSize: "14px", color: "#666" }}>Loading...</p>
      )}

      {!loading && recentVins.length === 0 && (
        <p style={{ fontSize: "14px", color: "#666" }}>No VIN history yet.</p>
      )}

      {recentVins.map((vin, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            padding: "8px",
            marginTop: "6px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          <p
            onClick={() => onSelectVin(vin)}
            style={{
              cursor: "pointer",
              margin: 0,
              flex: 1,
              fontSize: "14px",
            }}
          >
            {vin}
          </p>
          <button
            onClick={() => removeVin(vin)}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              marginLeft: "8px",
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
