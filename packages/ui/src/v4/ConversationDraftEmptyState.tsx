/**
 * 新建任务草稿空态：教智星教学智能体问候与氛围。
 * 保留按时间段换问候与标题自适应字号逻辑。
 */
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/components/lib/utils.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { useIsOfficeMode } from "@/hooks/useInterfaceMode.js";
import { logger } from "@/logger.js";
import { JiaozhixingMark } from "@/teaching/JiaozhixingMark.js";
import "@/teaching/draft-new-task.css";

const GREETING_BOUNDARY_HOURS = [5, 9, 12, 14, 18, 23] as const;
const GREETING_MIN_FONT_SIZE_PX = 20;
const GREETING_MAX_FONT_SIZE_PX = 28;

type ChatEmptyGreetingMessageId =
  | "chat.empty.greeting.morningEarly"
  | "chat.empty.greeting.morning"
  | "chat.empty.greeting.noon"
  | "chat.empty.greeting.afternoon"
  | "chat.empty.greeting.evening"
  | "chat.empty.greeting.lateNight";

function getChatEmptyGreetingMessageId(date: Date = new Date()): ChatEmptyGreetingMessageId {
  const hour = date.getHours();

  if (hour >= 5 && hour < 9) return "chat.empty.greeting.morningEarly";
  if (hour >= 9 && hour < 12) return "chat.empty.greeting.morning";
  if (hour >= 12 && hour < 14) return "chat.empty.greeting.noon";
  if (hour >= 14 && hour < 18) return "chat.empty.greeting.afternoon";
  if (hour >= 18 && hour < 23) return "chat.empty.greeting.evening";

  return "chat.empty.greeting.lateNight";
}

function getNextChatEmptyGreetingDelayMs(date: Date = new Date()) {
  const candidates = GREETING_BOUNDARY_HOURS.map((hour) => {
    const boundary = new Date(date);
    boundary.setHours(hour, 0, 0, 0);
    return boundary;
  });
  const tomorrowFirstBoundary = new Date(date);
  tomorrowFirstBoundary.setDate(tomorrowFirstBoundary.getDate() + 1);
  tomorrowFirstBoundary.setHours(GREETING_BOUNDARY_HOURS[0], 0, 0, 0);

  const nextBoundary =
    candidates.find((candidate) => candidate.getTime() > date.getTime()) ?? tomorrowFirstBoundary;

  return Math.max(1, nextBoundary.getTime() - date.getTime());
}

function resolveGreetingFontSizePx({
  availableWidthPx,
  naturalTextWidthPx,
}: {
  availableWidthPx: number;
  naturalTextWidthPx: number;
}) {
  if (
    !Number.isFinite(availableWidthPx) ||
    !Number.isFinite(naturalTextWidthPx) ||
    availableWidthPx <= 0 ||
    naturalTextWidthPx <= 0 ||
    availableWidthPx >= naturalTextWidthPx
  ) {
    return GREETING_MAX_FONT_SIZE_PX;
  }

  return Math.max(
    GREETING_MIN_FONT_SIZE_PX,
    Math.min(
      GREETING_MAX_FONT_SIZE_PX,
      Math.floor(GREETING_MAX_FONT_SIZE_PX * (availableWidthPx / naturalTextWidthPx)),
    ),
  );
}

export function ConversationDraftEmptyState({ className }: { className?: string }) {
  const { intl } = useJiaoZhiXingIntl();
  const isOfficeMode = useIsOfficeMode();
  const [greetingDate, setGreetingDate] = useState(() => new Date());
  const [greetingFontSizePx, setGreetingFontSizePx] = useState(GREETING_MAX_FONT_SIZE_PX);
  const greetingContainerRef = useRef<HTMLParagraphElement | null>(null);
  const greetingMeasurementRef = useRef<HTMLSpanElement | null>(null);
  const greeting = intl.formatMessage({
    id: isOfficeMode ? "chat.empty.greeting.teaching" : getChatEmptyGreetingMessageId(greetingDate),
  });
  const greetingHint = isOfficeMode
    ? intl.formatMessage({ id: "chat.empty.greeting.teaching.hint" })
    : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setGreetingDate(new Date());
    }, getNextChatEmptyGreetingDelayMs(greetingDate));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [greetingDate]);

  useLayoutEffect(() => {
    const container = greetingContainerRef.current;
    const measurement = greetingMeasurementRef.current;
    if (!container || !measurement) {
      return;
    }

    let frameId: number | null = null;
    const measure = () => {
      frameId = null;
      const containerStyle = window.getComputedStyle(container);
      const horizontalPaddingPx =
        Number.parseFloat(containerStyle.paddingLeft) +
        Number.parseFloat(containerStyle.paddingRight);
      const availableWidthPx = Math.max(
        0,
        container.getBoundingClientRect().width - horizontalPaddingPx,
      );
      const naturalTextWidthPx = measurement.getBoundingClientRect().width;
      const nextFontSizePx = resolveGreetingFontSizePx({
        availableWidthPx,
        naturalTextWidthPx,
      });

      setGreetingFontSizePx((currentFontSizePx) => {
        if (currentFontSizePx === nextFontSizePx) {
          return currentFontSizePx;
        }
        logger.debug("[v4-draft-greeting] 标题自身可用宽度变化，更新字号", {
          availableWidthPx: Math.round(availableWidthPx),
          naturalTextWidthPx: Math.round(naturalTextWidthPx),
          previousFontSizePx: currentFontSizePx,
          nextFontSizePx,
        });
        return nextFontSizePx;
      });
    };
    const scheduleMeasure = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(measure);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", scheduleMeasure);
      return () => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }
        window.removeEventListener("resize", scheduleMeasure);
      };
    }

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(container);
    observer.observe(measurement);
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      observer.disconnect();
    };
  }, [greeting]);

  return (
    <div
      data-jzx-new-task=""
      className={cn(
        "jzx-new-task relative mb-8 flex w-full max-w-3xl flex-col items-center justify-center gap-5 text-foreground sm:mb-6",
        className,
      )}
    >
      <div className="jzx-new-task-glow pointer-events-none absolute inset-x-8 -top-6 h-40" aria-hidden />

      <div className="jzx-new-task-mark relative z-10" aria-hidden>
        <JiaozhixingMark className="size-14 rounded-2xl shadow-md" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-2 px-4">
        {isOfficeMode ? (
          <div className="text-ui-caption font-medium tracking-wide text-foreground-subtle">
            {intl.formatMessage({ id: "chat.empty.teaching.eyebrow" })}
          </div>
        ) : null}
        <p
          ref={greetingContainerRef}
          data-v4-draft-greeting="true"
          style={
            {
              "--v4-draft-greeting-font-size": `${greetingFontSizePx}px`,
            } as CSSProperties
          }
          className={cn(
            "w-full text-center font-semibold tracking-tight text-foreground",
            "text-[length:var(--v4-draft-greeting-font-size)]/[1.2]",
          )}
        >
          <span
            ref={greetingMeasurementRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute whitespace-nowrap text-3xl/[1.2]"
          >
            {greeting}
          </span>
          <span>{greeting}</span>
        </p>
        {greetingHint ? (
          <p className="max-w-xl text-center text-ui-caption text-foreground-subtle">{greetingHint}</p>
        ) : null}
      </div>

      {isOfficeMode ? (
        <ul className="relative z-10 m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0">
          {(["pre", "exam", "review", "lab"] as const).map((chip) => (
            <li
              key={chip}
              className="jzx-new-task-chip rounded-full border border-border px-2.5 py-1 text-ui-xs text-foreground-subtle"
            >
              {intl.formatMessage({ id: `chat.empty.teaching.chip.${chip}` })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
