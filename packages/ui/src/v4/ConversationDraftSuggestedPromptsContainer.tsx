import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { useIsOfficeMode } from "@/hooks/useInterfaceMode.js";
import { useSettings } from "@/hooks/useSettingService.js";
import { useOnboardingRecordService } from "@/hooks/useOnboardingRecordService.js";
import { advanceRecommendedPromptPane, getRecommendedPromptsForPane, getRecommendedPromptsRevision, registerRecommendedPromptPane, subscribeRecommendedPrompts, unregisterRecommendedPromptPane } from "./featureSuggestedPromptRotation.js";
import { cn } from "@/components/lib/utils.js";
import { toast } from "@/components/ui/toast.js";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useWorkspaceServicesResolution } from "@/hooks/useWorkspaceServices.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { logger } from "@/logger.js";
import type { AutomationsNavigationTab } from "@/lib/taskNavigationHistory.js";
import { reportPromptTemplateClick } from "@/lib/promptTemplateTelemetry.js";
import { useJiaoZhiXingSessionStore } from "@/store/zcodeSessionStore.js";
import { ConversationDraftSuggestedPrompts, type DraftSuggestedPromptItem } from "./ConversationDraftSuggestedPrompts.js";
import { resolveDraftSuggestedPromptText, DRAFT_SUGGESTED_PROMPT_NAVIGATE_AUTOMATIONS, DRAFT_SUGGESTED_PROMPT_NAVIGATE_AUTOMATIONS_OFFPEAK } from "./draftSuggestedPromptItems.js";
import { useDraftSuggestedPromptItems } from "./useDraftSuggestedPromptItems.js";
type Props = { className?:string; proactive?:boolean; workspacePath:string;workspaceIdentity?:string;remoteSessionId?:string|null;isDesktop?:boolean;onOpenAutomations?:(tab?:AutomationsNavigationTab)=>void; };
export function ConversationDraftSuggestedPromptsContainer({
  className,
  proactive = false,
  workspacePath,
  workspaceIdentity,
  remoteSessionId,
  onOpenAutomations,
  isDesktop = false,
}: Props) {
  const { intl, locale } = useJiaoZhiXingIntl();
  const platform = usePlatform();
  const isOfficeMode = useIsOfficeMode();
  const { update } = useSettings();
  const onboardingRecordService = useOnboardingRecordService();
  const recommendationPaneId = useId();
  const recommendationMode = isOfficeMode ? "office" : "coding";
  const recommendationRevision = useSyncExternalStore(
    subscribeRecommendedPrompts,
    getRecommendedPromptsRevision,
  );
  useEffect(() => {
    if (!proactive) return;
    registerRecommendedPromptPane(recommendationPaneId, recommendationMode);
    return () => unregisterRecommendedPromptPane(recommendationPaneId);
  }, [proactive, recommendationMode, recommendationPaneId]);
  const recommendedItems = useMemo(
    () => getRecommendedPromptsForPane(recommendationPaneId, recommendationMode),
    [recommendationMode, recommendationPaneId, recommendationRevision],
  );
  const [closing, setClosing] = useState(false);
  const closeRecommendations = async () => {
    setClosing(true);
    try {
      // 关闭按钮与引导、设置页共用持久化设置，避免另一份本地开关重新显示推荐。
      await update({ proactiveSuggestionsEnabled: false });
      // 手动修改反向回写 record，换号同步时不会把已关闭的推荐复活；失败不阻塞关闭流程。
      await onboardingRecordService
        ?.updateRecordPreferences({ proactiveSuggestionsEnabled: false })
        .catch((cause: unknown) => {
          logger.warn("[v4-suggested-prompts] 回写引导记录失败", { error: String(cause) });
        });
    } catch (error) {
      logger.warn("[v4-suggested-prompts] 关闭推荐失败", { error: String(error) });
      toast(intl.formatMessage({ id: "chat.officeSuggestions.closeError" }));
    } finally {
      setClosing(false);
    }
  };
  const resolution = useWorkspaceServicesResolution(
    workspacePath,
    remoteSessionId,
    workspaceIdentity,
  );
  const allItems = useDraftSuggestedPromptItems({clientScenesService:resolution.services.clientScenesService,rpcReady:resolution.rpcReady,workspaceKey:workspaceIdentity?.trim() || workspacePath});
  const items = (proactive ? recommendedItems : allItems).filter(item=> !item.actions?.length || Boolean(onOpenAutomations));
  const handleSelect=(item:DraftSuggestedPromptItem)=>{
    const prompt=resolveDraftSuggestedPromptText(item.prompt,locale);
    if(isDesktop) void reportPromptTemplateClick(platform,{templateId:item.id,templateName:resolveDraftSuggestedPromptText(item.label,locale),templatePrompt:prompt});
    if(item.actions?.includes(DRAFT_SUGGESTED_PROMPT_NAVIGATE_AUTOMATIONS_OFFPEAK)){onOpenAutomations?.("idle");return;}
    if(item.actions?.includes(DRAFT_SUGGESTED_PROMPT_NAVIGATE_AUTOMATIONS)){onOpenAutomations?.();return;}
    // 推荐仅预填教师请求，所有技能由原生技能目录与发送上下文处理。
    useJiaoZhiXingSessionStore.getState().requestComposerTextInsert(workspacePath,prompt,workspaceIdentity);
  };
  return <div data-v4-draft-suggested-prompts-slot="true" className={cn(!proactive&&"h-8",className)}><ConversationDraftSuggestedPrompts items={items} layout={proactive?"list":"chips"} onSelect={handleSelect} onRefresh={proactive?()=>advanceRecommendedPromptPane(recommendationPaneId):undefined} onClose={proactive?closeRecommendations:undefined} disabled={closing}/></div>;
}
