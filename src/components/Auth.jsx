import { useState } from "react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase"; // Make sure path is correct
import { doc, setDoc } from "firebase/firestore";
//const auth = getAuth();

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // 🔐 LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 🆕 SIGN UP
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create a user profile in Firestore with 5 free credits
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    credits: 15,
    createdAt: new Date()
  });
      }

      // ✅ Notify parent (App.jsx) that auth is done
      onAuthSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f3f5",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "350px",
          padding: "25px",
          borderRadius: "10px",
          background: "white",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {isLogin ? "Login" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "red", fontSize: "14px" }}>{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            style={buttonStyle}
          >
            {isLogin ? "Login" : "Sign Up"}
          </motion.button>
        </form>

        <p style={{ textAlign: "center", marginTop: "15px" }}>
          {isLogin ? "New user?" : "Already have an account?"}{" "}
          <span
            style={{ color: "#007bff", cursor: "pointer" }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create account" : "Login"}
          </span>
        </p>
      </motion.div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  background: "#1d3557",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
};
