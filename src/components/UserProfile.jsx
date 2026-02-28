import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      // 🔹 Listen to the user's document in real-time
      const userRef = doc(db, "users", user.uid);
      
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile fetch error:", error);
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    }
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading profile...</p>;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={profileCardStyle}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#1d3557" }}>User Profile</h3>
      <div style={infoRow}>
        <strong>Email:</strong> <span>{userData?.email || auth.currentUser?.email}</span>
      </div>
      <div style={infoRow}>
        <strong>Credits Remaining:</strong> 
        <span style={creditBadgeStyle}>{userData?.credits ?? 0}</span>
      </div>
    </motion.div>
  );
};

/* ---------------- STYLES ---------------- */

const profileCardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  maxWidth: "400px",
  margin: "20px auto",
  border: "1px solid #e1e4e8"
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontSize: "15px"
};

const creditBadgeStyle = {
  background: "#e63946",
  color: "white",
  padding: "2px 10px",
  borderRadius: "20px",
  fontWeight: "bold",
  fontSize: "14px"
};

export default UserProfile;