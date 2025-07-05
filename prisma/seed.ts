import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fakeObituaries = [
  {
    title: "RIP SnackSendr",
    blurb: "A snack delivery app that died from founder burnout and bad UI. Gone too soon.",
    causes: ["founder-burnout", "bad-ui", "market-saturation"],
    storyMd: "## The Rise and Fall of SnackSendr\n\nWe thought we could disrupt the snack delivery space. We were wrong.\n\n### What went wrong:\n- Founder worked 80-hour weeks for 8 months straight\n- UI looked like it was designed in 2005\n- Turns out people just go to the store for snacks\n\n### Lessons learned:\n- Sleep is not optional\n- Hire a designer\n- Validate your market first",
    mediaUrls: [],
    upvotes: 42,
    roastScore: 15
  },
  {
    title: "RIP PetTech AI",
    blurb: "AI-powered pet care that couldn't even take care of itself. Lasted 3 months.",
    causes: ["over-engineering", "no-market-need", "ai-hype"],
    storyMd: "## The AI Pet Care Revolution That Wasn't\n\nWe built an AI that could predict when your pet needed food, water, exercise, and love. Unfortunately, we couldn't predict when our startup would need funding.\n\n### The tech was cool:\n- Computer vision for pet behavior analysis\n- ML models for health predictions\n- IoT sensors for everything\n\n### The business was not:\n- $50/month for a pet app? Really?\n- Pet owners just... look at their pets\n- We spent 90% of time on tech, 10% on customers",
    mediaUrls: [],
    upvotes: 67,
    roastScore: 23
  },
  {
    title: "RIP CryptoLaundry",
    blurb: "Blockchain-based laundry service. The only thing that got washed was our money.",
    causes: ["crypto-winter", "regulatory-issues", "terrible-idea"],
    storyMd: "## LaundryCoins: The Future of Clean Clothes\n\nWe tokenized laundry. Yes, really. Each wash cycle was an NFT. Each dryer session was a smart contract.\n\n### The 'vision':\n- Decentralized laundry network\n- Proof-of-wash consensus mechanism\n- LaundryCoins as payment\n\n### Reality check:\n- Gas fees cost more than actual laundry\n- Nobody wanted crypto laundry\n- We got rugged by our own washing machines\n\n### Final words:\n- Not everything needs blockchain\n- Sometimes a quarter is just a quarter\n- We're all clean out of money",
    mediaUrls: [],
    upvotes: 134,
    roastScore: 89
  },
  {
    title: "RIP FoodieAI",
    blurb: "AI food recommendation app that recommended dog food to humans. Ruff ending.",
    causes: ["bad-ai", "data-poisoning", "no-testing"],
    storyMd: "## When AI Goes Wrong: A Culinary Catastrophe\n\nOur AI was supposed to recommend the perfect meal based on your mood, weather, and dietary preferences. Instead, it recommended Purina to a food blogger.\n\n### The algorithm:\n- Scraped 10M food reviews\n- Trained on restaurant data\n- Accidentally included pet food sites\n\n### The disaster:\n- Recommended kibble for romantic dinners\n- Suggested cat treats for birthday parties\n- Our 5-star review was from a golden retriever\n\n### Lessons:\n- Always validate your training data\n- Test with humans, not just metrics\n- Dogs are surprisingly good at app reviews",
    mediaUrls: [],
    upvotes: 89,
    roastScore: 45
  },
  {
    title: "RIP SocialFi",
    blurb: "Social media meets DeFi. Users earned tokens for likes. We earned bankruptcy.",
    causes: ["ponzi-mechanics", "sec-investigation", "bear-market"],
    storyMd: "## The Social Token That Wasn't So Social\n\nWe gamified social media with crypto rewards. Users earned $SOCIAL tokens for engagement. VCs earned exit liquidity.\n\n### The tokenomics:\n- 1 like = 0.1 $SOCIAL\n- 1 share = 0.5 $SOCIAL\n- 1 comment = 0.2 $SOCIAL\n- 1 SEC notice = ∞ legal fees\n\n### The collapse:\n- Token went from $10 to $0.001\n- Users started botting for tokens\n- Platform became 99% spam\n- SEC called it a security\n\n### Final thoughts:\n- Not all social interactions need monetization\n- Ponzi schemes are still ponzi schemes\n- The real tokens were the lawsuits we made along the way",
    mediaUrls: [],
    upvotes: 156,
    roastScore: 78
  }
];

async function main() {
  console.log('🌱 Seeding database with fake obituaries...');
  
  // Create a fake user first
  const user = await prisma.user.upsert({
    where: { email: 'founder@killedit.com' },
    update: {},
    create: {
      email: 'founder@killedit.com',
      handle: 'gravekeeper',
      avatarUrl: null,
      karma: 100
    }
  });

  // Create fake obituaries
  for (const obit of fakeObituaries) {
    await prisma.obituary.create({
      data: {
        ...obit,
        founderId: user.id
      }
    });
  }

  console.log('✅ Seeded 5 fake obituaries');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 