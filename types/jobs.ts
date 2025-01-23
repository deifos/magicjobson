export interface Job {
  id: number;
  title: string;
  description: string;
}

export interface JobCategory {
  id: number;
  title: string;
  tags: string[];
  jobs: Job[];
}

export const mockJobCategories: JobCategory[] = [
  {
    id: 1,
    title: "Engineering Roles",
    tags: ["Frontend Development", "Backend Engineering", "DevOps"],
    jobs: [
      {
        id: 1,
        title: "Senior Frontend Developer",
        description:
          "Lead frontend development initiatives using React and Next.js",
      },
      {
        id: 2,
        title: "Backend Engineer",
        description: "Build scalable APIs and microservices",
      },
    ],
  },
  {
    id: 2,
    title: "Design Roles",
    tags: ["UI Design", "User Research", "Product Design"],
    jobs: [
      {
        id: 3,
        title: "Product Designer",
        description: "Create intuitive user experiences for our platform",
      },
      {
        id: 4,
        title: "UI/UX Designer",
        description: "Design beautiful and functional interfaces",
      },
    ],
  },
  {
    id: 3,
    title: "Product Roles",
    tags: ["Product Management", "Product Strategy", "Analytics"],
    jobs: [
      {
        id: 5,
        title: "Product Manager",
        description: "Drive product vision and execution",
      },
      {
        id: 6,
        title: "Product Analyst",
        description: "Analyze product metrics and user behavior",
      },
    ],
  },
];
