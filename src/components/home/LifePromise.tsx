import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";

export function LifePromise() {
  const reduce = useReducedMotion();

  return (
    <motion.p
      initial={reduce ? undefined : { opacity: 0, y: 20 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      className="font-serif font-medium text-lg sm:text-xl lg:text-2xl text-muted-foreground/70 leading-relaxed max-w-3xl mx-auto text-center px-4"
    >
      Um lugar onde você pertence, cresce e faz diferença — mesmo nas segundas difíceis.
    </motion.p>
  );
}