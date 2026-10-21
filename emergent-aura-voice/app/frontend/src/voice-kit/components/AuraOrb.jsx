import { motion } from "framer-motion";
import { STATUS_META } from "../core/protocol";

export const AuraOrb = ({ status = "idle", level = 0, size = 280, pad = 1.6, testId = "aura-orb-element" }) => {
  const meta = STATUS_META[status] || STATUS_META.idle;
  const scale = 1 + Math.min(1, level) * 0.35;
  return (
    <div className="relative grid place-items-center" style={{ width: size * pad, height: size * pad }}>
      <motion.div
        aria-hidden
        className="absolute rounded-full blur-3xl"
        style={{ width: size * 1.25, height: size * 1.25, background: meta.glow }}
        animate={{ scale: scale * 1.08, opacity: status === "idle" ? 0.45 : 0.9 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
      <motion.div
        data-testid={testId}
        data-status={status}
        className={`orb-core relative rounded-full overflow-hidden ${status === "processing" ? "orb-think" : ""}`}
        style={{ width: size, height: size, "--orb": meta.color, boxShadow: `0 0 80px 10px ${meta.glow}` }}
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.6 }}
      >
        <div className="orb-swirl absolute inset-[-25%]" />
        <div className="orb-swirl orb-swirl-2 absolute inset-[-25%]" />
        <div className="absolute inset-0 rounded-full orb-sheen" />
      </motion.div>
    </div>
  );
};
