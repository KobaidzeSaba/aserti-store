// Channel registry — the one place that knows the set of channels.
import type { ChannelAdapter } from "./types";
import { onlineStoreAdapter } from "./onlineStore";
import { woltAdapter } from "./wolt";
import { glovoAdapter } from "./glovo";
import { chatbotAdapter } from "./chatbot";

export const ADAPTERS: Record<string, ChannelAdapter> = {
  [onlineStoreAdapter.channel]: onlineStoreAdapter,
  [woltAdapter.channel]: woltAdapter,
  [glovoAdapter.channel]: glovoAdapter,
  [chatbotAdapter.channel]: chatbotAdapter,
};

export function getAdapter(channel: string): ChannelAdapter {
  const a = ADAPTERS[channel];
  if (!a) throw new Error(`Unknown channel "${channel}".`);
  return a;
}

export * from "./types";
