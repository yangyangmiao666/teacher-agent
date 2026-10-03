import { useJiaoZhiXingStoreWithDefault } from "@/store/StoreProvider.js";

export function useIsOfficeMode(): boolean {
  return useJiaoZhiXingStoreWithDefault((state) => state.interfaceMode === "office", false);
}
