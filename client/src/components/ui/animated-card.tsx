import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface AnimatedCardProps {
  children: ReactNode
  index?: number
  className?: string
  delay?: number
  onClick?: () => void
}

export function AnimatedCard({ 
  children, 
  index = 0, 
  className = "", 
  delay = 0.05,
  onClick 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card 
        className="transition-all duration-300 hover:shadow-lg"
        onClick={onClick}
      >
        {children}
      </Card>
    </motion.div>
  )
}

export function AnimatedGrid({ 
  children, 
  className = "",
  stagger = 0.05 
}: { 
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ 
  children,
  className = ""
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.3 }
        }
      }}
      whileHover={{ y: -2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}