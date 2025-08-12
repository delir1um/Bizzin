import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

const getVariants = (direction: string, distance: number) => {
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    up: {
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0 }
    },
    down: {
      hidden: { opacity: 0, y: -distance },
      visible: { opacity: 1, y: 0 }
    },
    left: {
      hidden: { opacity: 0, x: distance },
      visible: { opacity: 1, x: 0 }
    },
    right: {
      hidden: { opacity: 0, x: -distance },
      visible: { opacity: 1, x: 0 }
    }
  };
  
  return variants[direction as keyof typeof variants] || variants.fade;
};

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 30,
  className = '',
  once = true
}: ScrollRevealProps) {
  const variants = getVariants(direction, distance);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once, 
        amount: 0.1, // Trigger when 10% of element is visible
        margin: "-50px" // Start animation 50px before element enters viewport
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth feel
      }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// Specialized components for common patterns
export function FadeInUp({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <ScrollReveal direction="up" delay={delay} className={className}>
      {children}
    </ScrollReveal>
  );
}

export function FadeInLeft({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <ScrollReveal direction="left" delay={delay} className={className}>
      {children}
    </ScrollReveal>
  );
}

export function FadeInRight({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <ScrollReveal direction="right" delay={delay} className={className}>
      {children}
    </ScrollReveal>
  );
}

export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <ScrollReveal direction="fade" delay={delay} className={className}>
      {children}
    </ScrollReveal>
  );
}

// Staggered container for animating multiple children with delays
export function StaggerContainer({ children, className = '', staggerDelay = 0.1 }: { 
  children: ReactNode[]; 
  className?: string; 
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <ScrollReveal key={index} delay={index * staggerDelay}>
              {child}
            </ScrollReveal>
          ))
        : children
      }
    </div>
  );
}