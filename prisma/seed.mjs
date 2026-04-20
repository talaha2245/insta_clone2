/**
 * Seed script: creates 20 realistic users + posts + follows + likes + comments
 * Run with: node --env-file=.env prisma/seed.mjs
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";

const prisma = new PrismaClient();

// ─── Realistic user data ────────────────────────────────────────────────────
const USERS = [
  { name: "Alex Rivera",      username: "alexrivera",    email: "alex@theinsta.dev",     bio: "Full-stack dev 🚀 Building cool stuff every day" },
  { name: "Priya Sharma",     username: "priyasharma",   email: "priya@theinsta.dev",    bio: "UI/UX designer ✨ Making the web beautiful" },
  { name: "Marcus Johnson",   username: "marcusj",       email: "marcus@theinsta.dev",   bio: "Coffee addict ☕ | Open source contributor" },
  { name: "Luna Chen",        username: "lunachen",      email: "luna@theinsta.dev",     bio: "Product manager by day, gamer by night 🎮" },
  { name: "Diego Morales",    username: "diegom",        email: "diego@theinsta.dev",    bio: "DevOps engineer | Docker & Kubernetes enthusiast" },
  { name: "Zara Ahmed",       username: "zaraahmed",     email: "zara@theinsta.dev",     bio: "Data scientist 📊 | Python & ML lover" },
  { name: "Kai Nakamura",     username: "kainakamura",   email: "kai@theinsta.dev",      bio: "Indie hacker building SaaS in public 💻" },
  { name: "Sofia Petrov",     username: "sofiapetrov",   email: "sofia@theinsta.dev",    bio: "Backend developer | Rust & Go enthusiast" },
  { name: "Jordan Walsh",     username: "jordanwalsh",   email: "jordan@theinsta.dev",   bio: "Frontend wizard 🧙 React & Next.js fanatic" },
  { name: "Amara Osei",       username: "amaraosei",     email: "amara@theinsta.dev",    bio: "Mobile dev 📱 | Flutter & React Native" },
  { name: "Liam Brennan",     username: "liambrennan",   email: "liam@theinsta.dev",     bio: "CTO at a startup | Ex-Google | Building in stealth" },
  { name: "Nadia Volkov",     username: "nadiavolkov",   email: "nadia@theinsta.dev",    bio: "Security researcher 🔐 | Bug bounty hunter" },
  { name: "Chen Wei",         username: "chenwei",       email: "chenwei@theinsta.dev",  bio: "Blockchain developer ⛓ | DeFi & Web3" },
  { name: "Isabella Torres",  username: "isabellatx",    email: "bella@theinsta.dev",    bio: "Game developer 🎮 | Unity & Unreal Engine" },
  { name: "Finn Larsen",      username: "finnlarsen",    email: "finn@theinsta.dev",     bio: "Cloud architect ☁️ | AWS & Azure certified" },
  { name: "Mei Wong",         username: "meiwong",       email: "mei@theinsta.dev",      bio: "AI researcher 🤖 | LLMs & computer vision" },
  { name: "Omar Hassan",      username: "omarhassan",    email: "omar@theinsta.dev",     bio: "Startup founder | Mentor | Building the future" },
  { name: "Ava Kowalski",     username: "avakowalski",   email: "ava@theinsta.dev",      bio: "Developer advocate 🎤 | Conference speaker" },
  { name: "Raj Patel",        username: "rajpatel",      email: "raj@theinsta.dev",      bio: "SRE engineer | Monitoring & observability nerd" },
  { name: "Emma Lindqvist",   username: "emmalindqvist", email: "emma@theinsta.dev",     bio: "Tech lead at Spotify | Music + Code = ❤️" },
];

const POSTS = [
  "Just shipped a new feature to production! 🚀 Zero downtime deployment is the dream.",
  "Hot take: TypeScript has made me a better developer in ways I never expected.",
  "Finally got my side project to #1 on Product Hunt! Thank you all for the support! 🙌",
  "Reading through the React 19 docs and my mind is blown 🤯 Server Components are everything.",
  "Three years into my dev career and I still Google how to center a div every single day. No shame.",
  "Just open-sourced my CLI tool for managing Docker containers. Stars welcome! ⭐ #opensource",
  "If you're not writing tests, you're just debugging in production. Learn from my mistakes. 😅",
  "The best debugging session I ever had was pair programming with a rubber duck. Literally.",
  "Tailwind CSS was a cult to me 6 months ago. Now I can never go back to vanilla CSS. #convert",
  "Reminder: done is better than perfect. Ship it, iterate, ship again. 🛳️",
  "CSS grid vs flexbox debate incoming... use both. They solve different problems. Thread 🧵",
  "Built my first AI-powered feature today. The future is really here. #AI #machinelearning",
  "5 years of remote work: my biggest lesson is to over-communicate. Always. 📡",
  "Just passed the AWS Solutions Architect exam! If I can do it, you can too 💪 #cloudcomputing",
  "Working on a dark theme for my portfolio. Somehow the dark version always looks cooler 😎",
  "Vim is hard until it isn't. Then it changes your life forever. Day 47 of the journey.",
  "Deployed my first Kubernetes cluster today. It's both amazing and absolutely terrifying. ☸️",
  "Hot tip: name your variables properly. Your future self will thank you. 🙏 #cleancode",
  "The PostgreSQL query optimizer is a work of art. Just spent an hour reading the docs for fun.",
  "Live coding stream tonight at 9PM! Building a real-time chat app from scratch. 🎙️ #webdev",
];

const COMMENTS = [
  "This is so inspiring! 🔥",
  "Totally agree with this take!",
  "I had the exact same experience last week 😂",
  "Amazing work, keep it up!",
  "This just saved my project, thank you!",
  "Been saying this for years, glad someone finally put it into words.",
  "Love this! Sharing with my whole team right now.",
  "The struggle is real 😅",
  "Following for more content like this!",
  "This is exactly what I needed to see today.",
];

// ─── Helper: pick random items ───────────────────────────────────────────────
function sample(arr, n = 1) {
  if (!arr || arr.length === 0) return n === 1 ? undefined : [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  if (n === 1) return shuffled[0];
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Hash a shared password for all seed users ──────────────────────────
  const passwordHash = await hash("Password123!", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // ── 2. Create users ───────────────────────────────────────────────────────
  console.log("👥 Creating 20 users...");
  const createdUsers = [];

  for (const u of USERS) {
    const id = generateIdFromEntropySize(10);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`,
      },
      create: {
        id,
        username: u.username,
        displayName: u.name,
        email: u.email,
        passwordHash,
        bio: u.bio,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`,
      },
    });
    createdUsers.push(user);
    process.stdout.write(`  ✅ ${u.name} (@${u.username})\n`);
  }

  // ── 3. Create posts (1-3 posts per user) ──────────────────────────────────
  console.log("\n📝 Creating posts...");
  const createdPosts = [];
  const postPool = [...POSTS];

  for (const user of createdUsers) {
    const numPosts = randomInt(1, 3);
    for (let i = 0; i < numPosts && postPool.length > 0; i++) {
      const content = postPool.splice(
        Math.floor(Math.random() * postPool.length),
        1,
      )[0];
      const post = await prisma.post.create({
        data: {
          id: generateIdFromEntropySize(10),
          content,
          userId: user.id,
        },
      });
      createdPosts.push(post);
    }
  }
  console.log(`  ✅ Created ${createdPosts.length} posts`);

  // ── 4. Create follows (each user follows 5-12 others randomly) ────────────
  console.log("\n🤝 Creating follow relationships...");
  let followCount = 0;
  const followSet = new Set();

  for (const user of createdUsers) {
    const others = createdUsers.filter((u) => u.id !== user.id);
    const toFollow = sample(others, randomInt(5, 12));
    for (const target of toFollow) {
      const key = `${user.id}-${target.id}`;
      if (followSet.has(key)) continue;
      followSet.add(key);
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: target.id,
          },
        },
        update: {},
        create: {
          followerId: user.id,
          followingId: target.id,
        },
      });
      followCount++;
    }
  }
  console.log(`  ✅ Created ${followCount} follow relationships`);

  // ── 5. Create likes (each post gets 2-8 random likes) ────────────────────
  console.log("\n❤️  Creating likes...");
  let likeCount = 0;
  const likeSet = new Set();

  for (const post of createdPosts) {
    const likers = sample(
      createdUsers.filter((u) => u.id !== post.userId),
      randomInt(2, 8),
    );
    for (const liker of likers) {
      const key = `${liker.id}-${post.id}`;
      if (likeSet.has(key)) continue;
      likeSet.add(key);
      await prisma.like.upsert({
        where: { userId_postId: { userId: liker.id, postId: post.id } },
        update: {},
        create: { userId: liker.id, postId: post.id },
      });
      likeCount++;
    }
  }
  console.log(`  ✅ Created ${likeCount} likes`);

  // ── 6. Create comments (each post gets 1-4 random comments) ──────────────
  console.log("\n💬 Creating comments...");
  let commentCount = 0;

  for (const post of createdPosts) {
    const n = randomInt(1, 4);
    const commenters = createdUsers
      .filter((u) => u.id !== post.userId)
      .sort(() => Math.random() - 0.5)
      .slice(0, n);
    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          id: generateIdFromEntropySize(10),
          content: sample(COMMENTS),
          userId: commenter.id,
          postId: post.id,
        },
      });
      commentCount++;
    }
  }
  console.log(`  ✅ Created ${commentCount} comments`);

  // ── 7. Create bookmarks (each user bookmarks 3-6 posts) ───────────────────
  console.log("\n🔖 Creating bookmarks...");
  let bookmarkCount = 0;
  const bookmarkSet = new Set();

  for (const user of createdUsers) {
    const posts = sample(
      createdPosts.filter((p) => p.userId !== user.id),
      randomInt(3, 6),
    );
    for (const post of posts) {
      const key = `${user.id}-${post.id}`;
      if (bookmarkSet.has(key)) continue;
      bookmarkSet.add(key);
      await prisma.bookmark.create({
        data: {
          id: generateIdFromEntropySize(10),
          userId: user.id,
          postId: post.id,
        },
      });
      bookmarkCount++;
    }
  }
  console.log(`  ✅ Created ${bookmarkCount} bookmarks`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log("✅ SEED COMPLETE\n");
  console.log(`   Users     : ${createdUsers.length}`);
  console.log(`   Posts     : ${createdPosts.length}`);
  console.log(`   Follows   : ${followCount}`);
  console.log(`   Likes     : ${likeCount}`);
  console.log(`   Comments  : ${commentCount}`);
  console.log(`   Bookmarks : ${bookmarkCount}`);
  console.log("\n🔑 All users password: Password123!");
  console.log("\nLogin with any username above, e.g.:");
  console.log("  Username : alexrivera");
  console.log("  Password : Password123!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
