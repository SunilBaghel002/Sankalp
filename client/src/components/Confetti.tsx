import React from 'react'
import { motion } from 'framer-motion'

export const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 1 }}
          animate={{ y: window.innerHeight + 100, rotate: 360 }}
          transition={{ duration: 2 + Math.random() * 2, ease: 'linear' }}
          className="absolute w-3 h-3 bg-orange-500 rounded-full"
        />
      ))}
    </div>
  )
}