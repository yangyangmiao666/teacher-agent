import {
  ChannelClient,
  MessagePortProtocol,
  ProxyChannel,
  type MessagePortLike,
  type MessagePortPayload,
} from "@zcode/rpc";
import {
  IJiaoZhiXingTaskService,
  type IJiaoZhiXingTaskService as IJiaoZhiXingTaskServiceShape,
} from "#src/session/zcodeTaskService.js";
import {
  IJiaoZhiXingAgentService,
  type IJiaoZhiXingAgentService as IJiaoZhiXingAgentServiceShape,
} from "#src/zcode-agent/zcodeAgent.js";
import {
  IJiaoZhiXingSessionService,
  type IJiaoZhiXingSessionService as IJiaoZhiXingSessionServiceShape,
} from "#src/zcode-session/zcodeSession.js";
import {
  IModelSelectionService,
  type IModelSelectionService as IModelSelectionServiceShape,
} from "#src/model-provider/providerFacadeServices.js";

interface PortLike {
  on?(event: "message", listener: (event: { data: MessagePortPayload }) => void): void;
  off?(event: "message", listener: (event: { data: MessagePortPayload }) => void): void;
  addEventListener?(
    event: "message",
    listener: (event: { data: MessagePortPayload }) => void,
  ): void;
  removeEventListener?(
    event: "message",
    listener: (event: { data: MessagePortPayload }) => void,
  ): void;
  postMessage(message: MessagePortPayload): void;
  start?(): void;
  close?(): void;
}

function toMessagePortLike(port: PortLike): MessagePortLike {
  return {
    addEventListener(type, listener) {
      if (port.addEventListener) {
        port.addEventListener(type, listener);
        return;
      }
      port.on?.(type, listener);
    },
    removeEventListener(type, listener) {
      if (port.removeEventListener) {
        port.removeEventListener(type, listener);
        return;
      }
      port.off?.(type, listener);
    },
    postMessage(data) {
      port.postMessage(data);
    },
    start() {
      port.start?.();
    },
    close() {
      port.close?.();
    },
  };
}

export interface RemoteBotWorkspaceRuntimeServices {
  zcodeAgentService: IJiaoZhiXingAgentServiceShape;
  zcodeTaskService: IJiaoZhiXingTaskServiceShape;
  zcodeSessionService: IJiaoZhiXingSessionServiceShape;
  modelSelectionService: IModelSelectionServiceShape;
}

export function createRemoteRuntimeServicesFromPort(
  port: unknown,
): RemoteBotWorkspaceRuntimeServices {
  const protocol = new MessagePortProtocol(toMessagePortLike(port as PortLike));
  const client = new ChannelClient(protocol);
  return {
    zcodeAgentService: ProxyChannel.toService<IJiaoZhiXingAgentServiceShape>(
      client.getChannel(IJiaoZhiXingAgentService.channelName),
    ),
    zcodeTaskService: ProxyChannel.toService<IJiaoZhiXingTaskServiceShape>(
      client.getChannel(IJiaoZhiXingTaskService.channelName),
    ),
    zcodeSessionService: ProxyChannel.toService<IJiaoZhiXingSessionServiceShape>(
      client.getChannel(IJiaoZhiXingSessionService.channelName),
    ),
    modelSelectionService: ProxyChannel.toService<IModelSelectionServiceShape>(
      client.getChannel(IModelSelectionService.channelName),
    ),
  };
}
