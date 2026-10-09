import type { ConfiguratorUISpec } from "@gadgets/configurator-ui";
import type { YouTubeChannelConfiguratorUIType } from "./youtube-configurator-types";

// YouTube Channel has no per-resource configuration — the channel is always
// the one associated with the connected Google account. This configurator
// renders nothing and immediately yields the fixed resource URL.
const spec: ConfiguratorUISpec<YouTubeChannelConfiguratorUIType, Record<string, never>> = {
  initial: {},
  isReady: () => true,
  resourceUrl: () => "https://www.youtube.com/channel/mine/*",
  render: () => null,
};

export default spec;
