'use client'
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import type { Dictionary } from '@/components/internationalization';

interface CounterProps {
  end: number;
  title: string;
  suffix?: string;
  delay?: number;
}

interface NumberSectionProps {
  dictionary: Dictionary;
}

const Counter = ({ end, title, suffix = '+', delay = 0 }: CounterProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: 2500,
  });

  const displayValue = useTransform(springValue, (val) => Math.round(val));

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        springValue.set(end);
        setHasAnimated(true);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasAnimated, springValue, end, delay]);

  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (val) => {
      setCurrentValue(val);
    });
    return () => unsubscribe();
  }, [displayValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="text-center"
    >
      <motion.div
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-2 tabular-nums"
        initial={{ scale: 1 }}
        animate={hasAnimated ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, delay: 2 }}
      >
        <span>{currentValue}</span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={hasAnimated ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 2.2 }}
          className="text-foreground/70"
        >
          {suffix}
        </motion.span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay / 1000 + 0.3 }}
        viewport={{ once: true }}
        className="uppercase text-sm tracking-wider text-muted-foreground font-medium"
      >
        {title}
      </motion.div>
    </motion.div>
  );
};

export function NumberSection({ dictionary }: NumberSectionProps) {
  const numbers = dictionary.marketing.numbers;

  return (
    <div className="relative">
      {/* Background Image Section with Mask */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] bg-[url('/number.webp')] bg-cover bg-center bg-scroll md:bg-fixed">
        <div className="absolute inset-0 bg-black/50">
          <div className="h-full flex flex-col justify-end pb-10 sm:pb-12 md:pb-16" style={{ paddingInline: 'var(--container-padding)' }}>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-background mb-2">{numbers.company}</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-background/80">{numbers.inNumbers}</h1>
          </div>
        </div>
        {/* Angular Shape Divider with Three Peaks */}

      </div>

      {/* Counters Section */}
      <div className="bg-background text-foreground -mt-1 py-8 sm:py-10">
        <div style={{ paddingInline: 'var(--container-padding)' }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ staggerChildren: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            <Counter end={120} title={numbers.projects} suffix="" delay={0} />
            <Counter end={70} title={numbers.experts} suffix="" delay={150} />
            <Counter end={14} title={numbers.awards} suffix="" delay={300} />
            <Counter end={100} title={numbers.satisfied} suffix="" delay={450} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
