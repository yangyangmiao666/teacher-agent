import type { McpTrackedProcess } from "@zcode/adapters";
import type { JiaoZhiXingProcessChildProcessesResult } from "@zcode/shared";


export function listChildProcesses(
  tracked: readonly McpTrackedProcess[],
): JiaoZhiXingProcessChildProcessesResult {
  return {
    processes: tracked.map((process) => {
      return {
        pid: process.pid,
        serverName: process.serverName,
        mcpSource: process.mcpSource,
        ...({}),
      };
    }),
  };
}
