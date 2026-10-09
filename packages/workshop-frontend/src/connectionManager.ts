import { RpcStub, newWebSocketRpcSession } from 'capnweb'
import { PublicApi } from '@gadgets/workshop-shared/api'

// WebSocket RPC connection management.
// Extracted from main.tsx to eliminate circular imports between entrypoint and router tree.
let lastConnectTime: number = 0;
let backoff: number = 1000;

function getBackendHost(): string {
  // Only the Vite dev server is hosted separately from the backend. Built assets are served from
  // the same origin in both production and run-local mode.
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_BACKEND_HOST?.trim() || 'localhost:8787';
  }
  return window.location.host;
}

export function startConnection(): RpcStub<PublicApi> {
  lastConnectTime = Date.now();
  const apiHost = getBackendHost();
  const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + apiHost + '/api';
  return newWebSocketRpcSession<PublicApi>(wsUrl);
}

export const notifyCurrentStubUpdated: Set<() => void> = new Set();
export let isConnectionLost = false;
export let currentStub: RpcStub<PublicApi> = startConnection();

async function handleBroken(error: any) {
  console.warn('RPC connection lost:', error);

  isConnectionLost = true;
  for (let cb of notifyCurrentStubUpdated) { cb(); }

  let timeSinceConnect = Date.now() - lastConnectTime;
  if (timeSinceConnect < backoff) {
    let waitTime = backoff - timeSinceConnect;
    console.warn(`Will try again in ${Math.round(waitTime / 1000)} seconds...`)
    await new Promise(resolve => setTimeout(resolve, waitTime));
    console.warn(`Retrying connection...`);
    backoff = Math.min(backoff * 2, 10000);
  } else {
    backoff = 1000;
  }

  currentStub = startConnection();
  currentStub.onRpcBroken(handleBroken);

  // Don't clear isConnectionLost here — the new connection hasn't proven
  // it works yet. It gets cleared by markConnectionRestored() once the
  // app successfully communicates with the backend.
  for (let cb of notifyCurrentStubUpdated) {
    cb();
  }
}

currentStub.onRpcBroken(handleBroken);

/** Called externally (e.g., by auth) to indicate the connection is alive. */
export function markConnectionRestored() {
  if (!isConnectionLost) return;
  isConnectionLost = false;
  for (let cb of notifyCurrentStubUpdated) { cb(); }
}
