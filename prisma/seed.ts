import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "AI", slug: "ai", icon: "sparkles", color: "#8B5CF6" },
  { name: "Development", slug: "development", icon: "code", color: "#3B82F6" },
  { name: "Learning", slug: "learning", icon: "graduation-cap", color: "#10B981" },
  { name: "Finance", slug: "finance", icon: "wallet", color: "#F59E0B" },
  { name: "Shopping", slug: "shopping", icon: "shopping-bag", color: "#EC4899" },
  { name: "Entertainment", slug: "entertainment", icon: "clapperboard", color: "#EF4444" },
  { name: "News", slug: "news", icon: "newspaper", color: "#64748B" },
  { name: "Productivity", slug: "productivity", icon: "zap", color: "#06B6D4" },
  { name: "Social", slug: "social", icon: "users", color: "#F97316" },
  { name: "Work", slug: "work", icon: "briefcase", color: "#6366F1" },
];

const COLLECTIONS = [
  { name: "AI Tools", description: "The best AI assistants and tools", icon: "sparkles", color: "#8B5CF6", sortOrder: 0 },
  { name: "Design Inspiration", description: "Beautiful products to learn from", icon: "palette", color: "#EC4899", sortOrder: 1 },
  { name: "Reading List", description: "Articles and docs to read later", icon: "book-open", color: "#10B981", sortOrder: 2 },
];

const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

const BOOKMARKS: Array<{
  url: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  collection?: string;
  tags: string[];
  isFavorite?: boolean;
  visitCount: number;
  daysAgo: number;
}> = [
  {
    url: "https://claude.ai",
    name: "Claude",
    description: "AI assistant by Anthropic for writing, analysis, and coding.",
    domain: "claude.ai",
    category: "AI",
    collection: "AI Tools",
    tags: ["ai", "assistant"],
    isFavorite: true,
    visitCount: 87,
    daysAgo: 55,
  },
  {
    url: "https://github.com",
    name: "GitHub",
    description: "Where the world builds software. Code hosting and collaboration.",
    domain: "github.com",
    category: "Development",
    tags: ["code", "git", "open-source"],
    isFavorite: true,
    visitCount: 132,
    daysAgo: 60,
  },
  {
    url: "https://linear.app",
    name: "Linear",
    description: "The issue tracking tool your team will actually love using.",
    domain: "linear.app",
    category: "Productivity",
    collection: "Design Inspiration",
    tags: ["project-management", "design"],
    isFavorite: true,
    visitCount: 45,
    daysAgo: 48,
  },
  {
    url: "https://www.raycast.com",
    name: "Raycast",
    description: "A blazingly fast, totally extendable launcher for macOS.",
    domain: "raycast.com",
    category: "Productivity",
    collection: "Design Inspiration",
    tags: ["macos", "launcher", "design"],
    visitCount: 23,
    daysAgo: 42,
  },
  {
    url: "https://vercel.com",
    name: "Vercel",
    description: "Develop. Preview. Ship. The platform for frontend developers.",
    domain: "vercel.com",
    category: "Development",
    collection: "Design Inspiration",
    tags: ["hosting", "nextjs", "deploy"],
    visitCount: 56,
    daysAgo: 50,
  },
  {
    url: "https://developer.mozilla.org",
    name: "MDN Web Docs",
    description: "Resources for developers, by developers. The web reference.",
    domain: "developer.mozilla.org",
    category: "Learning",
    collection: "Reading List",
    tags: ["docs", "web", "reference"],
    visitCount: 74,
    daysAgo: 58,
  },
  {
    url: "https://tailwindcss.com",
    name: "Tailwind CSS",
    description: "Rapidly build modern websites without ever leaving your HTML.",
    domain: "tailwindcss.com",
    category: "Development",
    tags: ["css", "docs"],
    isFavorite: true,
    visitCount: 61,
    daysAgo: 44,
  },
  {
    url: "https://news.ycombinator.com",
    name: "Hacker News",
    description: "Social news for the technology and startup community.",
    domain: "news.ycombinator.com",
    category: "News",
    tags: ["tech", "startup"],
    visitCount: 98,
    daysAgo: 59,
  },
  {
    url: "https://www.figma.com",
    name: "Figma",
    description: "The collaborative interface design tool.",
    domain: "figma.com",
    category: "Work",
    tags: ["design", "collaboration"],
    visitCount: 34,
    daysAgo: 36,
  },
  {
    url: "https://www.notion.so",
    name: "Notion",
    description: "One workspace for notes, docs, wikis, and projects.",
    domain: "notion.so",
    category: "Productivity",
    tags: ["notes", "workspace"],
    visitCount: 41,
    daysAgo: 30,
  },
  {
    url: "https://openai.com",
    name: "OpenAI",
    description: "AI research and deployment company.",
    domain: "openai.com",
    category: "AI",
    collection: "AI Tools",
    tags: ["ai", "research"],
    visitCount: 29,
    daysAgo: 25,
  },
  {
    url: "https://stackoverflow.com",
    name: "Stack Overflow",
    description: "Where developers learn, share, and build careers.",
    domain: "stackoverflow.com",
    category: "Development",
    tags: ["q&a", "code"],
    visitCount: 52,
    daysAgo: 40,
  },
  {
    url: "https://www.youtube.com",
    name: "YouTube",
    description: "Enjoy videos and music, upload original content, and share it.",
    domain: "youtube.com",
    category: "Entertainment",
    tags: ["video", "music"],
    visitCount: 110,
    daysAgo: 57,
  },
  {
    url: "https://arc.net",
    name: "Arc Browser",
    description: "The browser that browses for you, from The Browser Company.",
    domain: "arc.net",
    category: "Productivity",
    collection: "Design Inspiration",
    tags: ["browser", "design", "macos"],
    visitCount: 12,
    daysAgo: 15,
  },
  {
    url: "https://huggingface.co",
    name: "Hugging Face",
    description: "The AI community building the future. Models, datasets, apps.",
    domain: "huggingface.co",
    category: "AI",
    collection: "AI Tools",
    tags: ["ai", "ml", "open-source"],
    visitCount: 18,
    daysAgo: 10,
  },
  {
    url: "https://stripe.com",
    name: "Stripe",
    description: "Financial infrastructure to accept payments and grow revenue.",
    domain: "stripe.com",
    category: "Finance",
    tags: ["payments", "api"],
    visitCount: 9,
    daysAgo: 8,
  },
];

async function main() {
  console.log("Seeding database…");

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { icon: c.icon, color: c.color },
      create: c,
    });
  }

  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { name: c.name },
      update: { description: c.description, icon: c.icon, color: c.color },
      create: c,
    });
  }

  const categories = await prisma.category.findMany();
  const collections = await prisma.collection.findMany();
  const byCategory = new Map(categories.map((c) => [c.name, c.id]));
  const byCollection = new Map(collections.map((c) => [c.name, c.id]));

  const existing = await prisma.bookmark.count();
  if (existing > 0) {
    console.log(`Skipping bookmarks: ${existing} already present.`);
    return;
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (const b of BOOKMARKS) {
    const createdAt = new Date(now - b.daysAgo * DAY);
    const bookmark = await prisma.bookmark.create({
      data: {
        url: b.url,
        name: b.name,
        description: b.description,
        domain: b.domain,
        faviconUrl: favicon(b.domain),
        isFavorite: b.isFavorite ?? false,
        visitCount: b.visitCount,
        lastVisitedAt: new Date(now - Math.floor(Math.random() * 5) * DAY),
        categoryId: byCategory.get(b.category),
        collectionId: b.collection ? byCollection.get(b.collection) : undefined,
        createdAt,
        tags: {
          connectOrCreate: b.tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });

    // Spread visit activity over the bookmark's lifetime so analytics
    // charts have believable weekly/monthly shape from day one.
    const events = Math.min(b.visitCount, 40);
    const activities = Array.from({ length: events }, () => ({
      type: "visited",
      bookmarkId: bookmark.id,
      createdAt: new Date(
        createdAt.getTime() + Math.random() * (now - createdAt.getTime())
      ),
    }));
    activities.push({ type: "created", bookmarkId: bookmark.id, createdAt });
    await prisma.activity.createMany({ data: activities });
  }

  console.log(`Seeded ${BOOKMARKS.length} bookmarks, ${CATEGORIES.length} categories, ${COLLECTIONS.length} collections.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
