import { motion } from 'framer-motion';
import Image from 'next/image';

const InitialLoader = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#232120]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="relative w-24 h-24 mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/assets/favicon.png"
            alt="Novellize"
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-[#F1592A] text-2xl font-medium tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          NOVELLIZE
        </motion.h1>
      </div>
    </motion.div>
  );
};

export default InitialLoader; 