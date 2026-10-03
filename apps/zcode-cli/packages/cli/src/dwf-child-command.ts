import { ZCODE_DWF_CHILD_COMMAND } from "@zcode/contracts";


import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { createContext, runInContext } from "node:vm";
import type { RunContext } from "@zcode/shared-types";

export function isDwfChildInvocation(argv: readonly string[]): boolean {
  return argv[0] === ZCODE_DWF_CHILD_COMMAND;
}

/** 入口文件导出面（child-source.ts 的 `renderChildEntry` 生成）。 */
interface ChildEntryModule {
  start?: (deps: {
    vm: { createContext: typeof createContext; runInContext: typeof runInContext };
    createInterface: typeof createInterface;
    stdin: NodeJS.ReadableStream;
    stdout: { write(chunk: string): unknown };
  }) => Promise<void>;
}

/**
 * 跑沙箱子进程直到脚本终结。`argv` 是去掉子命令名后的剩余参数，**末位**是入口文件路径。
 *
 * 必须 await 到终结才返回：CLI 入口在 `run()` 返回后会挂 1s 退出 watchdog
 * （shutdown.ts 的 `scheduleCliExitWatchdog`），提前返回等于让 watchdog 在 run 刚起步时强退子进程。
 */
export async function runDwfChildCommand(ctx: RunContext, argv: string[]): Promise<number> {
  const entryPath = argv[argv.length - 1];
  if (argv.length === 0 || entryPath === undefined) {
    ctx.stderr.write(`Usage: ${ZCODE_DWF_CHILD_COMMAND} <entry path>\n`);
    return 1;
  }

  try {
    // 动态 import 一份磁盘上的 ESM（与 plugin-host-command.ts 加载插件入口同款）。入口文件
    // 自己判定「不是进程入口」（argv[1] 是子命令名，不是它），不会自启，由这里调 start。
    const entry = (await import(pathToFileURL(resolve(entryPath)).href)) as ChildEntryModule;
    if (typeof entry.start !== "function") {
      throw new Error(`workflow entry file exports no start(): ${entryPath}`);
    }
    await entry.start({
      vm: { createContext, runInContext },
      createInterface,
      stdin: ctx.stdin,
      stdout: ctx.stdout,
    });
    return 0;
  } catch (error) {
    // stdout 是父进程的 NDJSON 通道，诊断只能走 stderr——harness 正是以子进程 stderr 归因
    // 「退出而未完成」的失败（harness.ts 的 child.on("close")）。
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr.write(`Workflow child failed: ${message}\n`);
    return 1;
  }
}
