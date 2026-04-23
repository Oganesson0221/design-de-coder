import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowBigUp,
  MessageSquare,
  GitFork,
  Star,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Plus,
  Eye,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/stores/project";
import { toast } from "sonner";
import { listEngineerProjects } from "@/services/engineerApi";

interface Post {
  id: string;
  projectId?: string;
  source?: "mock" | "straightup";
  title: string;
  author: { handle: string; avatar: string; isWoman: boolean };
  description: string;
  tags: string[];
  upvotes: number;
  comments: number;
  forks: number;
  stars: number;
  views: number;
  ago: string;
  diagram: string; // ascii preview
  topComment?: { handle: string; text: string };
}

const SEED_POSTS: Post[] = [
  {
    id: "p1",
    title: "neighborhood meal-share — postgres + redis + 2 workers",
    author: { handle: "@asha.codes", avatar: "AS", isWoman: true },
    description:
      "MVP for a doorstep meal-swap app. Picked sharded postgres over mongo because the relationships matter (cooks ↔ portions ↔ collectors). Roast me.",
    tags: ["mvp", "postgres", "redis", "she-builds"],
    upvotes: 247,
    comments: 38,
    forks: 12,
    stars: 91,
    views: 1840,
    ago: "3h",
    diagram: "[web] → [api-gw] → [orders-svc] → [pg]\n                  ↘ [worker] ↗",
    topComment: { handle: "@dmitry.eth", text: "love it. but where's the eventual consistency story when 2 collectors race for the last portion?" },
  },
  {
    id: "p2",
    title: "tinder-for-books — vector db saved my reco system",
    author: { handle: "@kenji_b", avatar: "KE", isWoman: false },
    description:
      "Started with collaborative filtering, hit the cold-start wall hard. Switched to embeddings + pgvector. Forks welcome — try a different embedding model.",
    tags: ["recsys", "pgvector", "embeddings"],
    upvotes: 189,
    comments: 24,
    forks: 31,
    stars: 76,
    views: 2210,
    ago: "8h",
    diagram: "[mobile] → [edge fn] → [embeddings] ↘\n                              [pgvector] → [reco]",
  },
  {
    id: "p3",
    title: "low-bandwidth grocery app for rural users",
    author: { handle: "@priya.sys", avatar: "PR", isWoman: true },
    description:
      "Designed for 2G/intermittent connectivity. SMS fallback for ordering, sync-on-connect for inventory. Bias score went from 71 → 28 after adding the SMS path.",
    tags: ["inclusive-design", "sms", "offline-first", "she-builds"],
    upvotes: 412,
    comments: 56,
    forks: 19,
    stars: 198,
    views: 3104,
    ago: "1d",
    diagram: "[ussd/sms] ↘\n[pwa offline] → [sync svc] → [pg + outbox]",
    topComment: { handle: "@mentor.lina", text: "this should be a case study. the SMS fallback is *the* lesson most designs skip." },
  },
  {
    id: "p4",
    title: "discord clone but for study groups (3 services, no kafka)",
    author: { handle: "@sam_t", avatar: "SA", isWoman: false },
    description:
      "Resisted the urge to add kafka. WebSockets + redis pubsub got me to 5k concurrent in load tests. Here's the diagram and where I think it'll snap.",
    tags: ["realtime", "websockets", "scaling"],
    upvotes: 156,
    comments: 19,
    forks: 8,
    stars: 47,
    views: 982,
    ago: "2d",
    diagram: "[ws gw] ↔ [redis pubsub] ↔ [chat svc] → [pg]",
  },
  {
    id: "p5",
    title: "fairness audit on my hiring-match v1 (bias score 84 → 31)",
    author: { handle: "@maria.fair", avatar: "MA", isWoman: true },
    description:
      "Walked through the ethicist tab. Removed name+university from the ranking features. Added an explainability layer. Long writeup inside.",
    tags: ["fairness", "ml-ops", "explainability", "she-builds"],
    upvotes: 523,
    comments: 87,
    forks: 44,
    stars: 312,
    views: 4988,
    ago: "3d",
    diagram: "[applicants] → [feature svc*] → [ranker] → [explain api]\n              *no name/uni",
    topComment: { handle: "@tarun.q", text: "forking this for our internship pipeline. thank you for showing the before/after score." },
  },
];

type Sort = "hot" | "new" | "top";

const Community = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [sort, setSort] = useState<Sort>("hot");
  const [filter, setFilter] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [forked, setForked] = useState<Record<string, boolean>>({});
  const awardPoints = useProject((s) => s.awardPoints);
  const awardBadge = useProject((s) => s.awardBadge);
  const setOnboarded = useProject((s) => s.setOnboarded);
  const setProjectId = useProject((s) => s.setProjectId);

  useEffect(() => {
    let mounted = true;
    async function loadDbProjects() {
      try {
        const response = await listEngineerProjects();
        if (!mounted) return;
        const dbPosts: Post[] = (response.projects || []).map((p, idx) => ({
          id: `db-${p.projectId}`,
          projectId: p.projectId,
          source: "straightup",
          title: p.title?.trim() || p.projectId,
          author: { handle: "@straightup.projects", avatar: "DB", isWoman: false },
          description:
            "Imported from straightup.projects. Fork to open this project directly in Build with its system architecture and database schema context.",
          tags: ["straightup", "db-import"],
          upvotes: 80 + idx * 3,
          comments: 6 + (idx % 7),
          forks: 3 + (idx % 9),
          stars: 12 + (idx % 20),
          views: 220 + idx * 9,
          ago: "db",
          diagram: `[project] ${p.title?.trim() || p.projectId}\n[build] system architecture + database schema`,
        }));
        setPosts((prev) => {
          const existingIds = new Set(prev.map((x) => x.id));
          const fresh = dbPosts.filter((x) => !existingIds.has(x.id));
          return [...prev, ...fresh];
        });
      } catch {
        // keep community mock feed usable if backend list fails
      }
    }
    void loadDbProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const upvote = (id: string) => {
    if (voted[id]) return;
    setVoted((v) => ({ ...v, [id]: true }));
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p)));
    awardPoints(2);
    awardBadge("community-voice");
    toast("+2 pts · upvoted");
  };

  const fork = (id: string) => {
    if (forked[id]) return;
    const post = posts.find((p) => p.id === id);
    setForked((v) => ({ ...v, [id]: true }));
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, forks: p.forks + 1 } : p)));
    awardPoints(15);
    if (post?.projectId) {
      setOnboarded(true);
      setProjectId(post.projectId);
      toast("+15 pts · forked into your studio");
      navigate(`/workspace?tab=learn&projectId=${encodeURIComponent(post.projectId)}`);
      return;
    }
    toast("+15 pts · forked into your studio");
  };

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  let visible = filter ? posts.filter((p) => p.tags.includes(filter)) : posts;
  visible = [...visible].sort((a, b) => {
    if (sort === "hot") return b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2);
    if (sort === "top") return b.stars - a.stars;
    return 0; // "new" keeps seed order
  });

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      {/* Repo-style header bar */}
      <section className="border-b-2 border-foreground bg-card">
        <div className="container py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="sticker bg-secondary">archway / community</span>
                <span className="sticker bg-card">public</span>
                <span className="sticker bg-accent text-accent-foreground hover-wiggle">
                  <Sparkles className="h-3 w-3" /> +50 pts when she joins
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
                the <span className="highlight-marker">design library</span>
                <span className="text-accent">.</span>
              </h1>
              <p className="mt-3 max-w-2xl font-display text-base text-muted-foreground">
                Real architectures shipped by real builders. <span className="highlight-pink">fork</span> what works, comment what doesn't, upvote what teaches.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" /> watch
              </Button>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" /> star
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/workspace">
                  <Plus className="h-4 w-4" /> publish yours
                </Link>
              </Button>
            </div>
          </div>

          {/* Repo stats */}
          <div className="mt-6 grid grid-cols-2 gap-px border-2 border-foreground bg-foreground sm:grid-cols-4">
            {[
              { k: posts.length.toString(), v: "designs" },
              { k: posts.reduce((a, p) => a + p.forks, 0).toString(), v: "forks" },
              { k: posts.reduce((a, p) => a + p.upvotes, 0).toString(), v: "upvotes" },
              { k: posts.filter((p) => p.author.isWoman).length.toString(), v: "by women" },
            ].map((s) => (
              <div key={s.v} className="bg-background px-4 py-3">
                <div className="font-display text-2xl font-bold tabular-nums">{s.k}</div>
                <div className="label-caps mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Feed */}
          <main>
            {/* Filter / sort bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground pb-3">
              <div className="flex items-center gap-1">
                {(["hot", "new", "top"] as Sort[]).map((s) => {
                  const Icon = s === "hot" ? TrendingUp : s === "new" ? Clock : Star;
                  return (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-smooth ${
                        sort === s
                          ? "border-foreground bg-foreground text-background shadow-stamp-sm"
                          : "border-transparent text-muted-foreground hover:border-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" /> {s}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="search designs…"
                  className="h-9 w-56 rounded-sm border-2 border-foreground bg-card pl-7 font-mono text-xs"
                />
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-5">
              {visible.map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="group flex gap-0 border-2 border-foreground bg-card shadow-stamp-sm transition-smooth hover:shadow-stamp"
                >
                  {/* Vote rail (reddit-style) */}
                  <div className="flex w-14 shrink-0 flex-col items-center justify-start gap-1 border-r-2 border-foreground bg-background py-4">
                    <button
                      onClick={() => upvote(post.id)}
                      className={`flex h-8 w-8 items-center justify-center border-2 transition-smooth ${
                        voted[post.id]
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-transparent hover:border-foreground hover:bg-accent/20"
                      }`}
                    >
                      <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <span className="font-mono text-sm font-bold tabular-nums">{post.upvotes}</span>
                    <span className="label-caps">pts</span>
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1 p-5">
                    {/* Meta */}
                    <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                      <span className="flex h-6 w-6 items-center justify-center border-2 border-foreground bg-secondary text-[10px] font-bold text-foreground">
                        {post.author.avatar}
                      </span>
                      <span className="font-semibold text-foreground">{post.author.handle}</span>
                      {post.author.isWoman && (
                        <span className="flex items-center gap-1 border border-foreground bg-highlight/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-highlight-foreground">
                          <Sparkles className="h-2.5 w-2.5" /> she-builds +50
                        </span>
                      )}
                      <span>·</span>
                      <span>{post.ago} ago</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {post.views.toLocaleString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold leading-snug transition-smooth group-hover:text-primary md:text-2xl">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 font-display text-base leading-relaxed text-foreground/80">
                      {post.description}
                    </p>

                    {/* ASCII diagram preview */}
                    <pre className="mt-4 overflow-x-auto border-2 border-dashed border-foreground/30 bg-grid-fine p-3 font-mono text-[11px] leading-relaxed text-foreground">
{post.diagram}
                    </pre>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <button
                          key={t}
                          onClick={() => setFilter(filter === t ? null : t)}
                          className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-smooth ${
                            t === "she-builds"
                              ? "border-foreground bg-highlight/60 text-highlight-foreground hover:bg-highlight"
                              : filter === t
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/30 bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                          }`}
                        >
                          #{t}
                        </button>
                      ))}
                    </div>

                    {/* Top comment preview (reddit-y) */}
                    {post.topComment && (
                      <div className="mt-4 border-l-2 border-primary bg-secondary/40 p-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          top comment · {post.topComment.handle}
                        </div>
                        <p className="mt-1 font-display text-sm italic leading-relaxed text-foreground/85">
                          "{post.topComment.text}"
                        </p>
                      </div>
                    )}

                    {/* Action bar (github-y) */}
                    <div className="mt-5 flex flex-wrap items-center gap-1 border-t-2 border-dashed border-foreground/20 pt-3">
                      <button className="flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> {post.comments} comments
                      </button>
                      <button
                        onClick={() => fork(post.id)}
                        className={`flex items-center gap-1.5 border-2 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-smooth ${
                          forked[post.id]
                            ? "border-success bg-success text-success-foreground"
                            : "border-transparent text-muted-foreground hover:border-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <GitFork className="h-3.5 w-3.5" /> {post.forks} {forked[post.id] ? "forked ✓" : "fork"}
                      </button>
                      <button className="flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground">
                        <Star className="h-3.5 w-3.5" /> {post.stars} stars
                      </button>
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        +15 pts to fork · +5 to comment
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Points rules */}
            <div className="border-2 border-foreground bg-card p-5 shadow-stamp-sm">
              <div className="label-caps mb-3">how points work</div>
              <ul className="space-y-2 font-display text-sm">
                <li className="flex items-baseline justify-between gap-3">
                  <span>publish a design</span>
                  <span className="font-mono text-xs font-bold text-primary">+30</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span>fork someone's design</span>
                  <span className="font-mono text-xs font-bold text-primary">+15</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span>helpful comment</span>
                  <span className="font-mono text-xs font-bold text-primary">+5</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span>upvote</span>
                  <span className="font-mono text-xs font-bold text-primary">+2</span>
                </li>
                <li className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-dashed border-foreground/20 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-highlight" /> woman on team
                  </span>
                  <span className="font-mono text-xs font-bold text-highlight-foreground bg-highlight/70 px-1.5">
                    +50
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-muted-foreground">design centers women users</span>
                  <span className="font-mono text-xs font-bold text-highlight-foreground bg-highlight/70 px-1.5">
                    +25
                  </span>
                </li>
              </ul>
              <p className="mt-4 font-display text-xs italic leading-relaxed text-muted-foreground">
                Inclusive design isn't a checkbox. It's a research advantage — and we reward it.
              </p>
            </div>

            {/* Filter by tag */}
            <div className="border-2 border-foreground bg-card p-5 shadow-stamp-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="label-caps">filter by tag</div>
                {filter && (
                  <button
                    onClick={() => setFilter(null)}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                  >
                    clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(filter === t ? null : t)}
                    className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-smooth ${
                      t === "she-builds"
                        ? "border-foreground bg-highlight/60 text-highlight-foreground hover:bg-highlight"
                        : filter === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            <div className="border-2 border-foreground bg-card p-5 shadow-stamp-sm">
              <div className="label-caps mb-3">top contributors · this week</div>
              <ol className="space-y-2 font-display text-sm">
                {[
                  { h: "@maria.fair", p: 1240, w: true },
                  { h: "@priya.sys", p: 980, w: true },
                  { h: "@kenji_b", p: 642, w: false },
                  { h: "@asha.codes", p: 588, w: true },
                  { h: "@dmitry.eth", p: 410, w: false },
                ].map((u, i) => (
                  <li key={u.h} className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      0{i + 1}.
                    </span>
                    <span className="flex-1 truncate">
                      {u.h}
                      {u.w && <span className="ml-1 text-highlight">✦</span>}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-primary">{u.p}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Link
              to="/mentor"
              className="block border-2 border-foreground bg-secondary p-5 shadow-stamp transition-smooth hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp-lg"
            >
              <div className="label-caps mb-2">— call for mentors —</div>
              <h4 className="font-display text-lg font-bold leading-tight">
                been through this loop a few times?
              </h4>
              <p className="mt-2 font-display text-sm text-foreground/75">
                Open your inbox to learners. Earn the mentor badge. Get featured.
              </p>
              <span className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                become a mentor →
              </span>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Community;
