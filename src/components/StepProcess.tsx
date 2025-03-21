import { motion } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description?: string;
}

interface StepProcessProps {
  title: string;
  subtitle?: string;
  steps: Step[];
}

export function StepProcess({ title, subtitle, steps }: StepProcessProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="relative p-6 md:p-8 bg-white dark:bg-[#2A2827] rounded-2xl shadow-xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-full h-full text-[#F1592A]"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <h3 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[#464646] dark:text-[#C3C3C3] mb-6">
            {subtitle}
          </p>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start gap-4 relative"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-10 w-0.5 h-full bg-gradient-to-b from-[#F1592A] to-transparent -z-10" />
              )}

              {/* Step number */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F1592A] to-[#FF8C94] text-white font-bold shadow-lg">
                {step.number}
              </div>

              {/* Step content */}
              <div className="flex-grow pt-2">
                <h4 className="text-lg font-semibold text-[#232120] dark:text-[#E7E7E8] mb-1">
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-[#464646] dark:text-[#C3C3C3]">
                    {step.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 