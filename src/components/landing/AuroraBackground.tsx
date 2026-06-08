import { motion } from "motion/react";

export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.24 295 / 0.6), transparent 70%)" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.16 220 / 0.6), transparent 70%)" }}
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.68 0.27 340 / 0.6), transparent 70%)" }}
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
