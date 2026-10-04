#!/usr/bin/env bash
# test-do-cost.sh — measures actual DO wall time and cost for a single prompt
# Usage: ./scripts/test-do-cost.sh
# 1. Run this script
# 2. Send ONE message on os.voltrix.stream and wait for response to finish
# 3. Wait ~30s for disconnect to happen
# 4. Script will print before/after/delta wall time and estimated cost

CF_TOKEN=$(grep CLOUDFLARE_API_TOKEN /home/voltrix/coursehero/.env.deploy | head -1 | cut -d= -f2- | tr -d '"')
ACCOUNT_ID="84f114e1b747a07d247ceb17b0c1dc14"
DO_COST_PER_GB_SEC=$(python3 -c "print(12.50/1_000_000)")

query_wall_time() {
  local NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local START=$(date -u -d "10 minutes ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-10M +"%Y-%m-%dT%H:%M:%SZ")
  curl -s "https://api.cloudflare.com/client/v4/graphql" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"{ viewer { accounts(filter: {accountTag: \\\"$ACCOUNT_ID\\\"}) { workersInvocationsAdaptive(limit: 10, filter: {datetime_geq: \\\"$START\\\", datetime_leq: \\\"$NOW\\\"}) { sum { requests wallTime } dimensions { scriptName } } } } }\"}" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
workers=d.get('data',{}).get('viewer',{}).get('accounts',[{}])[0].get('workersInvocationsAdaptive',[])
for w in workers:
    name=w['dimensions']['scriptName']
    if name=='voltrix-workshop':
        print(w['sum']['wallTime'])
        sys.exit(0)
print(0)
"
}

echo "=========================================="
echo " Voltrix DO Cost Test"
echo "=========================================="
echo ""
echo "Taking BEFORE snapshot..."
BEFORE=$(query_wall_time)
echo "voltrix-workshop wall time (last 10min): ${BEFORE}ms"
echo ""
echo ">>> NOW: Go to os.voltrix.stream, send ONE message, wait for response to finish"
echo ">>> Then wait ~30 seconds for the disconnect to trigger"
echo ">>> Press ENTER when done"
read

echo ""
echo "Waiting 35s to let disconnect + CF analytics propagate..."
sleep 35

echo "Taking AFTER snapshot..."
AFTER=$(query_wall_time)
echo "voltrix-workshop wall time (last 10min): ${AFTER}ms"
echo ""

python3 -c "
before=$BEFORE
after=$AFTER
delta_ms = after - before
delta_s = delta_ms / 1000
gb_sec = delta_s * 0.125
cost = gb_sec * 12.50 / 1_000_000

print('==========================================')
print(f' Results')
print('==========================================')
print(f' Wall time delta : {delta_s:.1f}s')
print(f' GB-seconds      : {gb_sec:.4f}')
print(f' DO cost         : \${cost:.6f}')
print()
if delta_s < 60:
    print(' ✅ GOOD — disconnect working (<60s per prompt)')
elif delta_s < 180:
    print(' ⚠️  MARGINAL — disconnecting but slowly (60-180s)')
else:
    print(' ❌ BAD — DO still running too long (>180s)')
print()
print(f' Projected per 1000 users × 10 prompts/day:')
print(f'   Daily DO cost = \${cost * 10000:.2f}')
print(f'   Monthly       = \${cost * 10000 * 30:.2f}')
"
