import { motion } from "framer-motion";

function Card({ children, className = "", onClick, id, style }) {
  return (
    <motion.div
      id={id}
      style={style}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className={`
        rounded-2xl
        border border-white/[0.07]
        bg-[#0e1626]/90
        shadow-[0_8px_30px_rgba(0,0,0,0.35)]
        p-5
        backdrop-blur-xl
        w-full
        transition-colors
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export default Card;
