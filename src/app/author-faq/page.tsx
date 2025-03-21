'use client'

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StepProcess } from "@/components/StepProcess"
import Image from "next/image"

const authorFaqs = [
  {
    question: "Who can upload content?",
    answer: "Anyone who has a published work or is starting to publish now! To upload content on Novellize, you need to request author access. This feature is available to registered users who wish to share their stories with the community. If you're not the author but wish to list your favorite book here, you can also request uploader access. Just don't forget to tag the author and let them know so they can take advantage of author privileges!"
  },
  {
    question: "How do I create an author page?",
    answer: "To create an author page, you first need to request author access. This feature is available to registered users who want to share their stories and engage with their audience. Once you have author access, you can navigate to the 'Create Author Page' section in your profile settings. Here, you can: Add a bio to introduce yourself, Upload a profile picture or banner, List your works with direct links, Share updates & announcements for your followers, and Engage with readers through comments and discussions. Your author page helps fans follow your journey, stay updated on your works, and interact with you directly!"
  },
  {
    question: "What types of content can I upload?",
    answer: "On Novellize, you can upload novels or comics, whether they are original works, translations (with proper credits and permissions), or fan fiction. Whether you're an author sharing your own story, a translator bringing amazing content to a wider audience, or a fan creating something inspired, we welcome all kinds of contributions! You can upload content in various styles and formats, including light novels, published novels, web novels/webtoons, graphic novels, novellas, short stories, serialized and episodic novels, epistolary novels, anthologies, choose-your-own-adventure books, and novels-in-verse. Additionally, you can upload cover art and extra illustrations to enhance your novel or comic's presentation and make it more engaging for readers."
  },
  {
    question: "Can I upload images, covers, and extra art?",
    answer: "Yes! Novellize allows you to upload images, covers, and extra art to enhance your novel or comic. You can add: Cover images to represent your work, Extra illustrations to showcase character designs, scenes, or concept art, and Promotional banners for better visibility. Make sure that the images you upload are high quality and comply with copyright guidelines. If you're uploading artwork that isn't yours, be sure to have permission from the original artist and give proper credit."
  },
  {
    question: "Can I make announcements?",
    answer: "Yes! You can create an announcement on your author page or in the community section. Once you submit your announcement, it will go to a moderator for approval. Once approved, it will be officially announced and visible to your followers and the community."
  },
  {
    question: "Can I remove or edit my uploaded content?",
    answer: "Yes! You can edit your content anytime to update details, fix errors, or improve your listing. If you want to remove your content, your request will go to a moderator for approval before it is taken down. This ensures proper content management and prevents accidental deletions."
  },
  {
    question: "Are there any restrictions on what I can post?",
    answer: "Yes. Please ensure that your content falls within the accepted categories listed in our content guidelines. Any content that does not fit into the approved novel or comic categories may not be accepted. Additionally, make sure your uploads comply with copyright rules and do not include prohibited or inappropriate material."
  },
  {
    question: "Can I schedule chapter releases?",
    answer: "Not yet! This feature is currently a work in progress (WIP), but we're working on adding it soon to make uploading even more convenient for authors and uploaders. Stay tuned for updates!"
  },
  {
    question: "How do I credit my team?",
    answer: "When you list your novel or comic, you will have an option at the end to add usernames of the people you want to credit. If multiple people contributed to the same role, you can separate their names with a comma. Currently, we support credits for 12 categories of contributors, including Series Artists, Translators, Editors, Proofreaders, Posters, Raw Providers, Art Directors, Drafters, Line Artists, Color Artists, Compositors, and Typesetters. If there's a role that isn't listed, feel free to suggest an addition through the suggestion box on the forum page."
  },
  {
    question: "Can I track my novel's engagement?",
    answer: "Yes! In the Author Console, you'll find a list of all the books you are the author of or have uploaded. By clicking on a book, you can view detailed engagement statistics, including views, follows, likes, and other interaction metrics. This helps you track your novel's performance and understand your audience better."
  },
  {
    question: "Are there monetization options for authors?",
    answer: "Not yet! This feature is currently a work in progress (WIP), but we're working on adding it soon to make uploading even more convenient for authors and uploaders. Stay tuned for updates!"
  },
  {
    question: "What happens if my novel gets reported?",
    answer: "If your novel gets reported, it will be sent to a moderator for review and will be temporarily hidden from the audience. The moderator will then determine whether the report is valid. If the report is unfair, your novel will be restored as usual, and the user who falsely reported it may receive a warning. If the report is valid, the novel will be blacklisted permanently, and you will receive a warning regarding the violation."
  },
  {
    question: "Can I collaborate with other authors?",
    answer: "Yes! If all participating authors mutually agree, you can collaborate on a novel or webcomic. Each collaborator can be credited properly in the Author Console, and contributions can be managed collectively. Currently, all uploads and edits are handled through a single uploader account, so it's recommended to coordinate with your co-authors on updates and management. Future updates may include a dedicated collaboration feature to streamline co-authoring!"
  },
  {
    question: "How do I handle fan translations of my work?",
    answer: "If you, as the author, are okay with fan translations, we can help facilitate the process on our platform and even connect you with fans interested in translating your work. However, if you do not approve of fan translations and someone is uploading them without your consent, especially on our platform, we can assist you in contacting the translator to either remove the content or reach a mutual agreement. Our goal is to respect authors' rights while supporting community-driven translations."
  }
];

const novelAddingSteps = [
  {
    number: "1️⃣",
    title: "Login to your account",
    description: "Make sure you have requested and received Author/Uploader access beforehand!"
  },
  {
    number: "2️⃣",
    title: "Confirm your access",
    description: "Check if the Author Console is visible in your profile"
  },
  {
    number: "3️⃣",
    title: "Go to the Author Console"
  },
  {
    number: "4️⃣",
    title: "Click on 'Add New Novel'"
  },
  {
    number: "5️⃣",
    title: "Fill in the details",
    description: "A popup will appear—fill in all the required details (you can copy-paste everything)"
  },
  {
    number: "6️⃣",
    title: "Click on 'Save Novel'"
  },
  {
    number: "7️⃣",
    title: "Done!",
    description: "Your novel will now appear in the Author Console 🎉"
  }
];

const chapterAddingSteps = [
  {
    number: "1️⃣",
    title: "Find your novel",
    description: "In the Author Console, locate your novel and click the 'Chapter List' button"
  },
  {
    number: "2️⃣",
    title: "View chapter list",
    description: "A list of already uploaded chapters (if any) will open up"
  },
  {
    number: "3️⃣",
    title: "Add new chapter",
    description: "Click on 'Add New Chapter'"
  },
  {
    number: "4️⃣",
    title: "Fill in chapter details",
    description: "Enter Chapter Number, Title, and Link, then save"
  },
  {
    number: "5️⃣",
    title: "Done!",
    description: "Your chapter is now published 🎉"
  }
];

const csvUploadSteps = [
  {
    number: "1️⃣",
    title: "Access CSV Upload",
    description: "Click on 'Upload Chapters (CSV)' in the Chapter List section"
  },
  {
    number: "2️⃣",
    title: "Get CSV Format",
    description: "Copy the CSV format provided next to the button"
  },
  {
    number: "3️⃣",
    title: "Prepare Your Data",
    description: "Fill in the details as per the format in your spreadsheet"
  },
  {
    number: "4️⃣",
    title: "Upload File",
    description: "Upload the CSV file to add all chapters at once"
  },
  {
    number: "5️⃣",
    title: "Done!",
    description: "All your chapters will be added within minutes! 🚀"
  }
];

const updateNovelSteps = [
  {
    number: "1️⃣",
    title: "Login and Access",
    description: "Login to your account and confirm your Author/Uploader access"
  },
  {
    number: "2️⃣",
    title: "Find Your Novel",
    description: "Go to the Author Console and locate your novel"
  },
  {
    number: "3️⃣",
    title: "Edit Details",
    description: "Click the edit button (pencil icon) to update novel details"
  },
  {
    number: "4️⃣",
    title: "Save Changes",
    description: "Make the necessary changes and save—your novel is now updated! 🎉"
  }
];

const updateChaptersSteps = [
  {
    number: "1️⃣",
    title: "Access Chapter List",
    description: "In the Author Console, find your novel and click the 'Chapter List' button"
  },
  {
    number: "2️⃣",
    title: "View Chapters",
    description: "A list of already uploaded chapters will open up"
  },
  {
    number: "3️⃣",
    title: "Make Changes",
    description: "To add a new chapter, click 'Add New Chapter'. To edit an existing one, click the edit button"
  },
  {
    number: "4️⃣",
    title: "Save Updates",
    description: "Fill in or update the details and save your changes"
  }
];

export default function AuthorFAQPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-[#E7E7E8] dark:bg-[#232120]">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F1592A' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Pen Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <svg
                className="w-8 h-8 text-[#F1592A] opacity-20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
            </motion.div>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F1592A] via-[#FF8C94] to-[#F1592A] mb-4"
            >
              Author & Uploader Guide
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl lg:text-2xl text-[#232120] dark:text-[#E7E7E8] max-w-3xl mx-auto"
            >
              Everything you need to know about publishing and managing your content on Novellize
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* FAQ Section - Takes 2 columns on xl screens */}
          <motion.div
            className="xl:col-span-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <div className="sticky top-24">
              <h2 className="text-2xl md:text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-6">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {authorFaqs.map((faq, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <AccordionItem
                      value={`item-${index}`}
                      className="bg-white dark:bg-[#2A2827] rounded-lg shadow-lg border-none"
                    >
                      <AccordionTrigger className="px-6 py-4 text-base md:text-lg font-semibold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 text-sm md:text-base text-[#464646] dark:text-[#C3C3C3]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          </motion.div>

          {/* Step Process Section - Takes 3 columns on xl screens */}
          <motion.div
            className="xl:col-span-3 space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="md:col-span-2">
                <StepProcess
                  title="How to Add a Novel"
                  subtitle="Follow these steps to add your novel to Novellize"
                  steps={novelAddingSteps}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <StepProcess
                  title="How to Add Chapters"
                  subtitle="Follow these steps to add chapters to your novel"
                  steps={chapterAddingSteps}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <StepProcess
                  title="Bulk Upload with CSV"
                  subtitle="Quick way to add multiple chapters at once"
                  steps={csvUploadSteps}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <StepProcess
                  title="Update Your Novel"
                  subtitle="How to edit your novel's details"
                  steps={updateNovelSteps}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <StepProcess
                  title="Manage Chapters"
                  subtitle="How to update or edit your chapters"
                  steps={updateChaptersSteps}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 