import { mutation, query, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("searchIndex")
      .withIndex("by_updatedAt", (q) => q)
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const create = mutation({
  args: {
    source: v.string(),
    path: v.string(),
    content: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("searchIndex", args);
  },
});
