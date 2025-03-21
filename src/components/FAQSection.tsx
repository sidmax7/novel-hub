import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Pen } from "lucide-react"
import Link from "next/link"

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is Novellize?",
    answer: "Novellize is an online directory that features web novels across various genres. We enlist the respective novel's/webtoon's chapters, both free and paywalled. This way, the reader will know the status of their book without hassle."
  },
  {
    question: "Is Novellize free to use?",
    answer: "Absolutely. We do not charge users anything."
  },
  {
    question: "Do I need an account to read novels?",
    answer: "You can browse without an account, but creating one allows you to track your novels, rate and follow the novel or author, and receive personalized recommendations. Doing so also gives you the privilege to add a novel to your library and engage in our community."
  },
  {
    question: "How often are new chapters updated?",
    answer: "Update frequency depends on the novel and its translator/author. Some update daily, while others follow a weekly schedule. Authors can provide updates through announcements, or you can check the novel details section for the latest information."
  },
  {
    question: "Can I list a novel or webcomic that I like?",
    answer: "Absolutely. Novellize is primarily focused on consolidating data for all web novels, irrespective of their language and region. We aim to help original authors reach a larger audience globally, and adding a novel/webtoon helps with that! You can request uploader access, and we'll get back to you."
  },
  {
    question: "What languages are supported?",
    answer: "We feature novels/webtoons of all languages. Our goal is to facilitate the global reach of authors regardless of language and region."
  },
  {
    question: "How can I support my favorite authors?",
    answer: "Since Novellize is a tool for individual writers and also features a community/sharing platform, you can support authors directly through the site. You can follow them, rate their works, or get redirected to their Ko-fi/Patreon or other support platforms they provide."
  },
  {
    question: "How do I find new novels or webcomics to read?",
    answer: "Novellize is a library and directory of novels and webcomics that gets updated whenever a new addition arrives! Simply hit the 'Browse All' button on the header at the top, and boom—voila! You'll discover a vast collection to explore."
  },
  {
    question: "Is there a mobile app for this platform?",
    answer: "Not yet. Hopefully soon!"
  },
  {
    question: "Can I change the website's theme or layout?",
    answer: "Novellize offers customization options, including dark mode for a better reading experience."
  },
  {
    question: "How do I join the community section?",
    answer: "All you have to do is register and click the Forum button to join. And there you go! Use your keyboard to your heart's content and start engaging with the community."
  }
];

export function FAQSection() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#E7E7E8] dark:bg-[#232120]">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F1592A] via-[#FF8C94] to-[#F1592A] mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl md:text-2xl text-[#232120] dark:text-[#E7E7E8] max-w-2xl mx-auto">
            Find answers to common questions about Novellize
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-white dark:bg-[#2A2827] rounded-lg shadow-lg border-none"
                >
                  <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-[#464646] dark:text-[#C3C3C3]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Author FAQ Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link href="/author-faq">
            <Button
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#F1592A] to-[#FF8C94] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6"
            >
              <span className="absolute inset-0 bg-white/20 transform -skew-x-12 group-hover:skew-x-12 transition-transform duration-500 ease-out opacity-0 group-hover:opacity-100" />
              <span className="relative flex items-center gap-2 text-lg">
                <Pen className="w-5 h-5" />
                Author & Uploader Guide
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                  Learn More
                </span>
              </span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
} 