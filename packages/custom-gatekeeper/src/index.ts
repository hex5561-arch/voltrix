export {
  VoltrixAcademicGatekeeper,
  VoltrixAcademicAccount,
  VoltrixVerifier,
  GatekeeperVendor,
} from "./custom.js";

export default {
  async fetch(): Promise<Response> {
    return new Response("Voltrix Academic Gatekeeper is running.", {
      headers: { "content-type": "text/plain" },
    });
  },
};
