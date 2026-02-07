import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    timestamp: v.number(),
    actionType: v.string(),
    description: v.string(),
    project: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    metadata: v.optional(v.any()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actionType", ["actionType"])
    .index("by_project", ["project"])
    .index("by_status", ["status"]),
  scheduledTasks: defineTable({
    name: v.string(),
    cronExpression: v.string(),
    nextRun: v.number(),
    lastRun: v.optional(v.number()),
    description: v.string(),
    enabled: v.boolean(),
  }).index("by_nextRun", ["nextRun"]),
  searchIndex: defineTable({
    source: v.string(),
    path: v.string(),
    content: v.string(),
    updatedAt: v.number(),
  })
    .index("by_source", ["source"])
    .index("by_updatedAt", ["updatedAt"]),
});
