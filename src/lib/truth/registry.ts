export const AGENTS = [
  { id: "barry", name: "Barry", role: "OpenClaw/Grok builder on port 18789; code/build agent" },
  { id: "harry", name: "Harry", role: "Gemma4 enrichment/scraping on port 18790; not coder" },
  { id: "bruce", name: "Bruce", role: "Hermes Grok bot; tools-first verification" },
  { id: "larry", name: "Larry", role: "Strategy / high-level thinking" },
  { id: "randy", name: "Randy", role: "Bruce-like bot Justin made" },
  { id: "hermes", name: "Hermes", role: "This local assistant/session runner" },
] as const;

export const REQUIRED_PROJECTS = [
  {
    id: "mission-control",
    name: "Mission Control",
    emoji: "🎛️",
    objective: "Truth Machine v2 rebuild",
    priority: 1,
    localPath: "/Users/justinfagan/dev/mission-control",
    repoUrl: "https://github.com/thejustinfagan/mission-control",
  },
  {
    id: "threadplay-simulator",
    name: "Threadplay Simulator",
    emoji: "🧵",
    objective: "Visual verification simulator for social game threads",
    priority: 3,
    localPath: "/Users/justinfagan/dev/threadplay-simulator-battle-dinghy-wire",
    liveUrl: "https://threadplay-simulator-production.up.railway.app",
  },
  {
    id: "battle-dinghy",
    name: "Battle Dinghy",
    emoji: "⚔️",
    objective: "Battle_Dinghy / Battle_Dinghy-Sim / @battle_dinghy game bot reliability",
    priority: 2,
    localPath: "/Users/justinfagan/dev/Battle_Dinghy",
    repoUrl: "https://github.com/thejustinfagan/Battle_Dinghy",
    liveUrl: "https://twitter.com/BattleDinghy",
  },
  {
    id: "fleet-intel",
    name: "Fleet Intel",
    emoji: "🚛",
    objective: "FMCSA carrier intelligence workflow proof",
    priority: 4,
    localPath: "/Users/justinfagan/dev/fleet-intel",
  },
  {
    id: "reseller-intel",
    name: "Reseller Intel",
    emoji: "🚗",
    objective: "Auto reseller intelligence pipeline recovery",
    priority: 5,
  },
] as const;
