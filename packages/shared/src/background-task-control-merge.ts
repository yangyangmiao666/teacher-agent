import type { JiaoZhiXingBackgroundTaskControlItem } from "./background-task-controls.js";

export function mergeJiaoZhiXingBackgroundTaskControlItems(
  current: readonly JiaoZhiXingBackgroundTaskControlItem[],
  updates: readonly JiaoZhiXingBackgroundTaskControlItem[],
): JiaoZhiXingBackgroundTaskControlItem[] {
  const jobsById = new Map(current.map((job) => [job.jobId, job] as const));
  for (const job of updates) {
    jobsById.set(job.jobId, job);
  }
  return Array.from(jobsById.values());
}
