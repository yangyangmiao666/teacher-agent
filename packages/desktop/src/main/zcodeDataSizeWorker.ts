import { isMainThread, parentPort, workerData } from "node:worker_threads";

import { scanJiaoZhiXingDataDirectory, type JiaoZhiXingDataSizeScanRequest } from "./zcodeDataSizeScanner.js";

type WorkerResponse =
  | { ok: true; result: Awaited<ReturnType<typeof scanJiaoZhiXingDataDirectory>> }
  | { ok: false; error: string };

const workerParentPort = parentPort;
if (!isMainThread && workerParentPort) {
  void scanJiaoZhiXingDataDirectory(workerData as JiaoZhiXingDataSizeScanRequest)
    .then((result) => {
      workerParentPort.postMessage({ ok: true, result } satisfies WorkerResponse);
    })
    .catch((error) => {
      workerParentPort.postMessage({
        ok: false,
        error: error instanceof Error ? error.message : "unknown worker error",
      } satisfies WorkerResponse);
    });
}
