import { motion } from "framer-motion";
import { useEffect } from "react";

export default function LandingPage({ onFinish }) {
  const TOTAL_DURATION = 7000; // landing page duration (7s)

  useEffect(() => {
    const timer = setTimeout(() => onFinish(), TOTAL_DURATION);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const text = "Propero VIN Decoder".split(""); // split into letters

  // Variants for staggered typing
  const container = {
    animate: {
      transition: {
        staggerChildren: 0.1, // delay between each letter
      },
    },
  };

  const letter = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#0d1b2a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* CAR + TEXT WRAPPER */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* SLEEK CAR */}
        <motion.svg
          width="180"
          height="80"
          viewBox="0 0 100 50"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ x: 500 }}
          animate={{ x: 0 }}
          exit={{ x: -500 }}
          transition={{ duration: 3.5 }}
          style={{ filter: "drop-shadow(0px 0px 6px #fff)" }}
        >
          <path d="
            M10 40 H90
            C95 40, 98 35, 98 30
            C98 25, 95 23, 90 23
            L85 23
            C80 15, 70 10, 50 10
            C30 10, 20 15, 15 23
            L10 23
            C5 23, 2 25, 2 30
            C2 35, 5 40, 10 40 Z
          "/>
          <line x1="50" y1="10" x2="50" y2="23" strokeWidth="1.5" />
          <circle cx="20" cy="40" r="5" />
          <circle cx="80" cy="40" r="5" />
        </motion.svg>

        {/* TYPING TEXT */}
        <motion.h1
          style={{
            display: "flex",
            color: "white",
            fontSize: "48px",
            fontWeight: "700",
            margin: 0,
            overflow: "hidden",
          }}
          variants={container}
          initial="initial"
          animate="animate"
        >
          {text.map((char, index) => (
            <motion.span key={index} variants={letter}>
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>
      </div>
    </div>
  );
}
