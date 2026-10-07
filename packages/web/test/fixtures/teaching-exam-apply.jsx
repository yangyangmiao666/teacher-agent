/** 只替换会话投影与文件 IO，挂载真实组卷编辑器和回复应用坞。 */
import React from "react";
import { createRoot } from "react-dom/client";
import { createStore } from "zustand/vanilla";
import { JiaoZhiXingIntlProvider } from "@/i18n/IntlProvider.js";
import { ServiceProvider } from "@/hooks/useServices.js";
import { V4ConversationContext } from "@/v4/V4ConversationContext.js";
import { ExamPaperBuilder } from "@/teaching/ExamPaperBuilder.js";
import { TeachingApplyDock } from "@/teaching/TeachingApplyDock.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import { ScopedErrorBoundary } from "@/ErrorBoundary.js";

const workspacePath = "/virtual/exam-browser-regression";
const sessionId = "exam-fixture-session";
const draft = useTeachingWorkbenchStore.getState().ensureWorkspace(workspacePath);
const before = JSON.stringify(draft);
const projection = createStore(() => ({ snapshot: { rows: { window: [] } } }));
const context = {
  layer: {
    acquire: () => ({ sessionId, store: projection, release() {} }),
  },
};
let rowId = 0;
window.examFixture = {
  receive(text, complete = true) {
    rowId += 1;
    projection.setState({
      snapshot: {
        rows: {
          window: [
            {
              kind: "assistantText",
              rowId,
              turnId: `turn-${rowId}`,
              text,
              state: complete ? "complete" : "streaming",
            },
          ],
        },
      },
    });
  },
  snapshot: () => useTeachingWorkbenchStore.getState().getWorkspace(workspacePath),
  before,
};
createRoot(document.getElementById("root")).render(
  <JiaoZhiXingIntlProvider initialLocale="zh-CN">
    <ServiceProvider services={{ fileService: { readdir: async () => [] } }}>
      <V4ConversationContext.Provider value={context}>
        <ScopedErrorBoundary scope="exam-regression">
          <TeachingApplyDock
            panelId="exam-builder"
            sessionId={sessionId}
            workspacePath={workspacePath}
          />
          <ExamPaperBuilder workspacePath={workspacePath} />
        </ScopedErrorBoundary>
      </V4ConversationContext.Provider>
    </ServiceProvider>
  </JiaoZhiXingIntlProvider>,
);
