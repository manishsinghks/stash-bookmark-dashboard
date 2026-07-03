import type { CategoryDto } from "@/types";
import { domainOf } from "@/utils/url";

/**
 * Zero-network category suggestion: exact domain map first, then
 * keyword heuristics. Slugs match the dashboard's seeded categories.
 * The user can always override in the popup.
 */
const DOMAIN_MAP: Record<string, string> = {
  // Development
  "github.com": "development",
  "gitlab.com": "development",
  "bitbucket.org": "development",
  "stackoverflow.com": "development",
  "developer.mozilla.org": "development",
  "npmjs.com": "development",
  "vercel.com": "development",
  "netlify.com": "development",
  "tailwindcss.com": "development",
  "react.dev": "development",
  "nextjs.org": "development",
  // AI
  "chatgpt.com": "ai",
  "openai.com": "ai",
  "claude.ai": "ai",
  "anthropic.com": "ai",
  "huggingface.co": "ai",
  "gemini.google.com": "ai",
  "perplexity.ai": "ai",
  "midjourney.com": "ai",
  // Entertainment
  "youtube.com": "entertainment",
  "netflix.com": "entertainment",
  "twitch.tv": "entertainment",
  "spotify.com": "entertainment",
  "hotstar.com": "entertainment",
  "primevideo.com": "entertainment",
  // Learning
  "leetcode.com": "learning",
  "coursera.org": "learning",
  "udemy.com": "learning",
  "khanacademy.org": "learning",
  "edx.org": "learning",
  "freecodecamp.org": "learning",
  "geeksforgeeks.org": "learning",
  "w3schools.com": "learning",
  // Social
  "linkedin.com": "social",
  "twitter.com": "social",
  "x.com": "social",
  "facebook.com": "social",
  "instagram.com": "social",
  "reddit.com": "social",
  "threads.net": "social",
  "discord.com": "social",
  // Shopping
  "amazon.com": "shopping",
  "amazon.in": "shopping",
  "flipkart.com": "shopping",
  "ebay.com": "shopping",
  "etsy.com": "shopping",
  "aliexpress.com": "shopping",
  "myntra.com": "shopping",
  // News
  "nytimes.com": "news",
  "bbc.com": "news",
  "bbc.co.uk": "news",
  "cnn.com": "news",
  "theguardian.com": "news",
  "news.ycombinator.com": "news",
  "reuters.com": "news",
  "theverge.com": "news",
  "techcrunch.com": "news",
  // Productivity
  "notion.so": "productivity",
  "linear.app": "productivity",
  "trello.com": "productivity",
  "asana.com": "productivity",
  "todoist.com": "productivity",
  "raycast.com": "productivity",
  "obsidian.md": "productivity",
  // Work
  "slack.com": "work",
  "zoom.us": "work",
  "figma.com": "work",
  "meet.google.com": "work",
  "teams.microsoft.com": "work",
  // Finance
  "stripe.com": "finance",
  "paypal.com": "finance",
  "coinbase.com": "finance",
  "robinhood.com": "finance",
  "zerodha.com": "finance",
  "groww.in": "finance",
};

const KEYWORD_RULES: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /docs?\.|\bapi\.|dev\.|developer\./, slug: "development" },
  { pattern: /learn|course|academy|tutorial|university|\.edu\b/, slug: "learning" },
  { pattern: /news|times|post\.|herald|daily/, slug: "news" },
  { pattern: /shop|store|cart|buy/, slug: "shopping" },
  { pattern: /\bai\b|gpt|llm|ml\./, slug: "ai" },
  { pattern: /bank|pay|invest|trade|crypto|finance/, slug: "finance" },
];

export function suggestCategorySlug(url: string): string | null {
  const domain = domainOf(url).toLowerCase();
  if (DOMAIN_MAP[domain]) return DOMAIN_MAP[domain];

  // Match parent domains, e.g. gist.github.com → github.com.
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (DOMAIN_MAP[parent]) return DOMAIN_MAP[parent];
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(domain)) return rule.slug;
  }
  return null;
}

export function suggestCategory(
  url: string,
  categories: CategoryDto[]
): CategoryDto | null {
  const slug = suggestCategorySlug(url);
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}
