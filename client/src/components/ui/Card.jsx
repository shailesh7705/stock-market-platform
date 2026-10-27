// client/src/components/ui/Card.jsx
import { motion } from "framer-motion";

function Card({ children, className = "", onClick, id, style }) {
  return (
    <motion.div
      id={id}
      style={style}
      onClick={onClick}
      whileHover={onClick ? { y: -1 } : undefined}
      transition={{ duration: 0.15 }}
      className={`
        rounded-2xl
        border border-white/[0.08]
        bg-[#0e1626]/90
        shadow-lg shadow-black/20
        p-5
        backdrop-blur-md
        w-full
        transition-all
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export default Card;
