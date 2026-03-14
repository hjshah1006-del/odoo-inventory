import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.2, 0.0, 0, 1.0] as [number, number, number, number] }}
      className="p-4 lg:p-6 min-h-screen"
    >
      {children}
    </motion.div>
  );
}
