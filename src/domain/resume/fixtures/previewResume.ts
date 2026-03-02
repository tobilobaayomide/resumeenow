import type { ResumeData } from "../types";

export const PREVIEW_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@email.com",
    phone: "+1 (555) 218-9041",
    jobTitle: "Senior Product Designer",
    location: "San Francisco, CA",
    website: "alexmorgan.design",
    links: [
      { id: "portfolio", label: "Portfolio", url: "alexmorgan.design" },
      { id: "linkedin", label: "LinkedIn", url: "linkedin.com/in/alexmorgan" },
    ],
  },
  summary:
    "Product designer with 7+ years building consumer and B2B experiences. I blend systems thinking, visual craft, and measurable UX outcomes to ship clean, scalable interfaces.",
  experience: [
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Northstar Labs",
      startDate: "2022",
      endDate: "Present",
      description:
        "Led end-to-end redesign of onboarding flow, improving activation by 31%. Partnered with PM and engineering to launch design system components used across 4 product squads.",
    },
    {
      id: "exp-2",
      role: "Product Designer",
      company: "Lumen Commerce",
      startDate: "2019",
      endDate: "2022",
      description:
        "Designed seller dashboard and analytics surfaces, reducing support tickets by 24%. Built reusable interaction patterns that accelerated feature delivery cycles.",
    },
  ],
  volunteering: [
    {
      id: "vol-1",
      role: "UX Mentor",
      company: "Design Futures",
      startDate: "2021",
      endDate: "Present",
      description:
        "Mentor junior designers on portfolio storytelling, systems thinking, and interview preparation.",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Checkout Optimization",
      link: "case-study.alexmorgan.design/checkout",
      startDate: "2023",
      endDate: "2024",
      description:
        "Reworked checkout IA and interaction patterns, increasing conversion by 18% across mobile and desktop.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Washington",
      degree: "B.A. in Interaction Design",
      startDate: "2014",
      endDate: "2018",
      description: "",
    },
  ],
  certifications: ["Google UX Design Certificate", "NN/g UX Management"],
  skills: [
    "Product Design",
    "Design Systems",
    "Figma",
    "Prototyping",
    "User Research",
    "Information Architecture",
  ],
  languages: ["English (Native)", "Spanish (Professional)"],
  achievements: [
    "Led onboarding redesign that improved activation by 31%",
    "Built design system used across 4 product squads",
  ],
};
