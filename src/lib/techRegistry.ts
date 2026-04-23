/**
 * Central registry mapping logoKey → SVG-safe brand color + display name.
 * SVG logos are loaded from https://cdn.simpleicons.org/{slug}
 * which serves official brand-colored SVGs.
 */

export interface TechMeta {
  name: string;
  slug: string;       // simpleicons.org slug
  color: string;      // brand hex
  kind: string;       // rough category
}

export const TECH_REGISTRY: Record<string, TechMeta> = {
  // Frontend
  react:        { name: "React",        slug: "react",        color: "#61DAFB", kind: "frontend" },
  nextjs:       { name: "Next.js",      slug: "nextdotjs",    color: "#000000", kind: "frontend" },
  vue:          { name: "Vue.js",       slug: "vuedotjs",     color: "#4FC08D", kind: "frontend" },
  nuxt:         { name: "Nuxt",         slug: "nuxtdotjs",    color: "#00DC82", kind: "frontend" },
  svelte:       { name: "Svelte",       slug: "svelte",       color: "#FF3E00", kind: "frontend" },
  angular:      { name: "Angular",      slug: "angular",      color: "#DD0031", kind: "frontend" },
  flutter:      { name: "Flutter",      slug: "flutter",      color: "#02569B", kind: "frontend" },
  reactnative:  { name: "React Native", slug: "react",        color: "#61DAFB", kind: "frontend" },

  // Backend
  nodejs:       { name: "Node.js",      slug: "nodedotjs",    color: "#339933", kind: "backend" },
  express:      { name: "Express",      slug: "express",      color: "#000000", kind: "backend" },
  fastify:      { name: "Fastify",      slug: "fastify",      color: "#000000", kind: "backend" },
  django:       { name: "Django",       slug: "django",       color: "#092E20", kind: "backend" },
  fastapi:      { name: "FastAPI",      slug: "fastapi",      color: "#009688", kind: "backend" },
  rails:        { name: "Ruby on Rails",slug: "rubyonrails",  color: "#CC0000", kind: "backend" },
  springboot:   { name: "Spring Boot",  slug: "springboot",   color: "#6DB33F", kind: "backend" },
  go:           { name: "Go",           slug: "go",           color: "#00ADD8", kind: "backend" },
  rust:         { name: "Rust",         slug: "rust",         color: "#000000", kind: "backend" },
  nestjs:       { name: "NestJS",       slug: "nestjs",       color: "#E0234E", kind: "backend" },

  // API / Gateway
  nginx:        { name: "NGINX",        slug: "nginx",        color: "#009639", kind: "api" },
  kong:         { name: "Kong",         slug: "kong",         color: "#003459", kind: "api" },
  graphql:      { name: "GraphQL",      slug: "graphql",      color: "#E10098", kind: "api" },
  trpc:         { name: "tRPC",         slug: "trpc",         color: "#2596BE", kind: "api" },
  apigw:        { name: "AWS API GW",   slug: "amazonapigateway", color: "#FF4F8B", kind: "api" },

  // Database
  postgresql:   { name: "PostgreSQL",   slug: "postgresql",   color: "#4169E1", kind: "database" },
  mysql:        { name: "MySQL",        slug: "mysql",        color: "#4479A1", kind: "database" },
  mongodb:      { name: "MongoDB",      slug: "mongodb",      color: "#47A248", kind: "database" },
  sqlite:       { name: "SQLite",       slug: "sqlite",       color: "#003B57", kind: "database" },
  supabase:     { name: "Supabase",     slug: "supabase",     color: "#3ECF8E", kind: "database" },
  planetscale:  { name: "PlanetScale",  slug: "planetscale",  color: "#000000", kind: "database" },
  firebase:     { name: "Firebase",     slug: "firebase",     color: "#FFCA28", kind: "database" },
  dynamodb:     { name: "DynamoDB",     slug: "amazondynamodb",color: "#4053D6", kind: "database" },
  cockroachdb:  { name: "CockroachDB",  slug: "cockroachlabs",color: "#6933FF", kind: "database" },

  // Cache
  redis:        { name: "Redis",        slug: "redis",        color: "#DC382D", kind: "cache" },
  memcached:    { name: "Memcached",    slug: "memcached",    color: "#3B6E9A", kind: "cache" },
  dragonfly:    { name: "Dragonfly",    slug: "dragonfly",    color: "#E91E63", kind: "cache" },

  // Queue / Messaging
  kafka:        { name: "Apache Kafka", slug: "apachekafka",  color: "#231F20", kind: "queue" },
  rabbitmq:     { name: "RabbitMQ",     slug: "rabbitmq",     color: "#FF6600", kind: "queue" },
  sqs:          { name: "Amazon SQS",   slug: "amazonsqs",    color: "#FF4F8B", kind: "queue" },
  bullmq:       { name: "BullMQ",       slug: "bullmq",       color: "#E01563", kind: "queue" },
  nats:         { name: "NATS",         slug: "natsdotio",    color: "#27AAE1", kind: "queue" },

  // Auth
  auth0:        { name: "Auth0",        slug: "auth0",        color: "#EB5424", kind: "auth" },
  clerk:        { name: "Clerk",        slug: "clerk",        color: "#6C47FF", kind: "auth" },
  supabaseauth: { name: "Supabase Auth",slug: "supabase",     color: "#3ECF8E", kind: "auth" },
  nextauth:     { name: "NextAuth.js",  slug: "nextdotjs",    color: "#000000", kind: "auth" },
  cognito:      { name: "AWS Cognito",  slug: "amazoncognito",color: "#DD344C", kind: "auth" },
  keycloak:     { name: "Keycloak",     slug: "keycloak",     color: "#4D4D4D", kind: "auth" },

  // Storage
  s3:           { name: "Amazon S3",    slug: "amazons3",     color: "#FF9900", kind: "storage" },
  cloudinary:   { name: "Cloudinary",   slug: "cloudinary",   color: "#3448C5", kind: "storage" },
  r2:           { name: "Cloudflare R2",slug: "cloudflare",   color: "#F38020", kind: "storage" },
  gcs:          { name: "Google Cloud Storage", slug: "googlecloud", color: "#4285F4", kind: "storage" },

  // CDN
  cloudflare:   { name: "Cloudflare",   slug: "cloudflare",   color: "#F38020", kind: "cdn" },
  vercel:       { name: "Vercel",       slug: "vercel",       color: "#000000", kind: "cdn" },
  fastly:       { name: "Fastly",       slug: "fastly",       color: "#FF282D", kind: "cdn" },
  awscloudfront:{ name: "CloudFront",   slug: "amazonaws",    color: "#FF9900", kind: "cdn" },

  // AI / ML
  openai:       { name: "OpenAI",       slug: "openai",       color: "#412991", kind: "ai" },
  anthropic:    { name: "Anthropic",    slug: "anthropic",    color: "#191919", kind: "ai" },
  huggingface:  { name: "HuggingFace",  slug: "huggingface",  color: "#FFD21E", kind: "ai" },
  replicate:    { name: "Replicate",    slug: "replicate",    color: "#000000", kind: "ai" },
  langchain:    { name: "LangChain",    slug: "langchain",    color: "#1C3C3C", kind: "ai" },
  pinecone:     { name: "Pinecone",     slug: "pinecone",     color: "#000000", kind: "ai" },

  // Infra / DevOps
  docker:       { name: "Docker",       slug: "docker",       color: "#2496ED", kind: "infra" },
  kubernetes:   { name: "Kubernetes",   slug: "kubernetes",   color: "#326CE5", kind: "infra" },
  awslambda:    { name: "AWS Lambda",   slug: "awslambda",    color: "#FF9900", kind: "infra" },
  githubactions:{ name: "GitHub Actions",slug: "githubactions",color: "#2088FF", kind: "infra" },
  terraform:    { name: "Terraform",    slug: "terraform",    color: "#7B42BC", kind: "infra" },
};

export function getTechMeta(logoKey: string): TechMeta {
  return (
    TECH_REGISTRY[logoKey] ?? {
      name: logoKey,
      slug: logoKey.toLowerCase().replace(/\s/g, ""),
      color: "#6b7280",
      kind: "other",
    }
  );
}

/** Returns the URL for a tech logo SVG from SimpleIcons CDN */
export function techLogoUrl(logoKey: string): string {
  const meta = getTechMeta(logoKey);
  const hex = meta.color.replace("#", "");
  return `https://cdn.simpleicons.org/${meta.slug}/${hex}`;
}

/** All techs grouped by kind for the left panel */
export function getTechsByKind(): Record<string, Array<{ logoKey: string; meta: TechMeta }>> {
  const groups: Record<string, Array<{ logoKey: string; meta: TechMeta }>> = {};
  for (const [logoKey, meta] of Object.entries(TECH_REGISTRY)) {
    if (!groups[meta.kind]) groups[meta.kind] = [];
    groups[meta.kind].push({ logoKey, meta });
  }
  return groups;
}
