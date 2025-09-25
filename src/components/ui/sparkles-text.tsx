"use client";

import React from "react";
import { motion } from "framer-motion";

interface SparklesTextProps {
  text: string;
  className?: string;
}

const SparklesText: React.FC<SparklesTextProps> = ({ text, className = "" }) => {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {text}
      <motion.span
        className="absolute -top-1 -right-1 text-yellow-400"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✨
      </motion.span>
    </motion.span>
  );
};

export default SparklesText;
