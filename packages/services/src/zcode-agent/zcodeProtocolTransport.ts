import type { Event, IDisposable } from "@zcode/rpc";
import type { JiaoZhiXingProtocolMessage } from "@zcode/shared";

export type JiaoZhiXingProtocolTransportKind = "stdio" | "websocket" | "memory";

export interface JiaoZhiXingProtocolTransportClosedEvent {
  code?: number | null;
  signal?: NodeJS.Signals | null;
  reason?: string;
}

export interface JiaoZhiXingProtocolTransport extends IDisposable {
  readonly kind: JiaoZhiXingProtocolTransportKind;
  readonly onMessage: Event<JiaoZhiXingProtocolMessage>;
  readonly onClose: Event<JiaoZhiXingProtocolTransportClosedEvent>;
  send(message: JiaoZhiXingProtocolMessage): Promise<void>;
  disposeAndWait?(): Promise<void>;
}
