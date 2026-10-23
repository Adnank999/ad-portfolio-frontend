export type Review = {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  sample?: boolean;
};

export const sampleReviews: Review[] = [
  {
    id: "review-1",
    quote:
      "Adnan has a way of making complicated problems feel manageable. We had a few technical challenges that weren't easy to figure out, but he broke everything down and came up with practical solutions. He really knows his way around both frontend and backend.",
    name: "Product Team",
    role: "Full-stack development",
    initials: "PT",
  },
  {
    id: "review-2",
    quote:
      "What stood out about Adnan was how he approached problems. He didn't just jump into writing code. He took the time to understand what was actually going wrong and figured out a better way to handle it. That made a big difference in the end.",
    name: "Engineering Team",
    role: "Backend & system architecture",
    initials: "ET",
  },
  {
    id: "review-3",
    quote:
      "Working with Adnan was a great experience. Some parts of the project turned out to be more complicated than we expected, but he stayed patient and worked through them. He communicates well, takes feedback seriously, and genuinely cares about the quality of his work.",
    name: "Project Partner",
    role: "Web application development",
    initials: "PP",
  },
  {
    id: "review-4",
    quote:
      "Adnan is someone you can trust with challenging technical work. Whether it's fixing a tricky issue, improving performance, or building something from scratch, he always tries to find a solution that makes sense long term, not just a quick fix.",
    name: "Development Team",
    role: "Full-stack engineering",
    initials: "DT",
  },
];

export const toolkit = ["React", "TypeScript", "Laravel", "Tailwind CSS", "Redis", "Framer Motion"];
