import {
  collectVisibleJiaoZhiXingBackgroundTaskControlItems,
  getJiaoZhiXingBackgroundTaskControlItemElapsedMs,
  isActiveJiaoZhiXingBackgroundTaskControlItem,
  parseJiaoZhiXingBackgroundTaskControlItems,
  type JiaoZhiXingBackgroundTaskControlItem,
  type JiaoZhiXingBackgroundTaskControlStatus,
} from "./background-task-controls.js";

export type JiaoZhiXingBackgroundBashJobStatus = JiaoZhiXingBackgroundTaskControlStatus;
export type JiaoZhiXingBackgroundBashJob = JiaoZhiXingBackgroundTaskControlItem & {
  taskKind: "bash";
};

export function parseJiaoZhiXingBackgroundBashJobs(value: unknown): JiaoZhiXingBackgroundBashJob[] {
  return parseJiaoZhiXingBackgroundTaskControlItems(value).filter(isBackgroundBashJob);
}

export function isActiveJiaoZhiXingBackgroundBashJob(job: JiaoZhiXingBackgroundBashJob): boolean {
  return isActiveJiaoZhiXingBackgroundTaskControlItem(job);
}

export function getJiaoZhiXingBackgroundBashJobElapsedMs(
  job: JiaoZhiXingBackgroundBashJob,
  now = Date.now(),
): number {
  return getJiaoZhiXingBackgroundTaskControlItemElapsedMs(job, now);
}

export function collectVisibleJiaoZhiXingBackgroundBashJobs(
  jobs: readonly JiaoZhiXingBackgroundBashJob[],
  now = Date.now(),
  thresholdMs = 30_000,
): Array<JiaoZhiXingBackgroundBashJob & { elapsedMs: number }> {
  return collectVisibleJiaoZhiXingBackgroundTaskControlItems(jobs, now, thresholdMs) as Array<
    JiaoZhiXingBackgroundBashJob & { elapsedMs: number }
  >;
}

function isBackgroundBashJob(job: JiaoZhiXingBackgroundTaskControlItem): job is JiaoZhiXingBackgroundBashJob {
  return job.taskKind === "bash";
}
