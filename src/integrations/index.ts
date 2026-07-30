export const integrations = {
  version: "2.0.0",
  available: ["n8n", "webhook", "rest-api", "viseron-apps", "omniroute", "call-system", "openjarvis", "asno"],
};

export { ViseronAppsIntegrationEngine } from "./viseron-apps/index";
export { getCifraIntegrationInfo } from "./viseron-apps/cifra-integration";
export { getProject1IntegrationInfo } from "./viseron-apps/project1-integration";
export { OmniRouteBridge, OmniRouteProvider } from "./omniroute/index";
export { OmniRouteHub } from "./omniroute/OmniRouteHub";
export { CallSystemBridge } from "./call-system/index";
export { OpenJarvisBridge } from "./openjarvis/index";
export { ASNOBridge } from "./asno/index";
export { SuperIntegration } from "./SuperIntegration";
