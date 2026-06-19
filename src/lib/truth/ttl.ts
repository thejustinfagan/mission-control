export const TTL = {
  agentHeartbeat: 5 * 60,
  httpProbe: 5 * 60,
  railwayDeploy: 60 * 60,
  githubStatus: 30 * 60,
  localFile: 24 * 60 * 60,
  staticRegistry: 12 * 60 * 60,
  agentReport: 30 * 60,
  browserCheck: 60 * 60,
  manualNote: 7 * 24 * 60 * 60,
} as const;
