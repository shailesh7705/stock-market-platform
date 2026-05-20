import { motion } from "framer-motion";

function Card({ children, className = "" }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-2xl
        border border-white/5
        bg-[#101827]/90
        shadow-[0_8px_30px_rgba(0,0,0,0.30)]
        p-5
        backdrop-blur-xl
        w-full
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export default Card;