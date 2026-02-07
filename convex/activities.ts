import { mutation, query, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("success"),
  v.literal("failed"),
  v.literal("pending"),
);

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filters: v.optional(
      v.object({
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        actionType: v.optional(v.string()),
        project: v.optional(v.string()),
        status: v.optional(statusValidator),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("activities").withIndex("by_timestamp", (q) => q);

    if (args.filters?.actionType) {
      q = q.filter((q) => q.eq(q.field("actionType"), args.filters?.actionType));
    }
    if (args.filters?.project) {
      q = q.filter((q) => q.eq(q.field("project"), args.filters?.project));
    }
    if (args.filters?.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.filters?.status));
    }
    if (args.filters?.startDate) {
      q = q.filter((q) => q.gte(q.field("timestamp"), args.filters?.startDate));
    }
    if (args.filters?.endDate) {
      q = q.filter((q) => q.lte(q.field("timestamp"), args.filters?.endDate));
    }

    return await q.order("desc").paginate(args.paginationOpts);
  },
});

export const create = mutation({
  args: {
    timestamp: v.number(),
    actionType: v.string(),
    description: v.string(),
    project: v.optional(v.string()),
    status: statusValidator,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});
