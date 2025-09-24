import { z } from "zod";

export const Insight = z.object({
  summary: z.string().min(30).max(280),         // 1–2 sentences, specific
  actions: z.array(z.string().min(8)).min(2).max(5), // concrete next steps
  risks: z.array(z.string().min(8)).max(3).optional(),
  sentiment: z.enum(["Excited","Positive","Neutral","Concerned","Stressed"]),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).min(1).max(5)
});

export const InsightResponse = z.object({
  entry_id: z.string(),
  model_version: z.string(),
  grounded_on: z.object({
    entry_chars: z.number(),
    recent_entries_used: z.number(),
    goals_used: z.number()
  }),
  insight: Insight
});

export type TInsightResponse = z.infer<typeof InsightResponse>;
export type TInsight = z.infer<typeof Insight>;