#!/usr/bin/env bash
# watch-do-cost.sh — polls CF analytics every 30s and prints wall time delta
# Shows whether the DO is still running or has hibernated after a prompt
# Usage: ./scripts/watch-do-cost.sh
# Run this, send a message on os.voltrix.stream, watch wall time stop growing

CF_TOKEN=$(grep CLOUDFLARE_API_TOKEN /home/voltrix/coursehero/.env.deploy | head -1 | cut -d= -f2- | tr -d '"')
ACCOUNT_ID="84f114e1b747a07d247ceb17b0c1dc14"

query_wall_time() {
  local NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local START=$(date -u -d "15 minutes ago" +"%Y-%m-%dT%H:%M:%SZ")
  curl -s "https://api.cloudflare.com/client/v4/graphql" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"{ viewer { accounts(filter: {accountTag: \\\"$ACCOUNT_ID\\\"}) { workersInvocationsAdaptive(limit: 10, filter: {datetime_geq: \\\"$START\\\", datetime_leq: \\\"$NOW\\\"}) { sum { requests wallTime } dimensions { scriptName } } } } }\"}" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
workers=d.get('data',{}).get('viewer',{}).get('accounts',[{}])[0].get('workersInvocationsAdaptive',[])
for w in workers:
    if w['dimensions']['scriptName']=='voltrix-workshop':
        print(w['sum']['wallTime'])
        sys.exit(0)
print(0)
"
}

echo "Watching voltrix-workshop DO wall time (polling every 30s)"
echo "Send a message on os.voltrix.stream to trigger activity"
echo "Ctrl+C to stop"
echo ""
printf "%-12s %-14s %-12s %s\n" "Time" "Wall(ms)" "Delta(ms)" "Status"
echo "------------------------------------------------------------"

PREV=0
while true; do
  NOW=$(date +"%H:%M:%S")
  CURRENT=$(query_wall_time)
  DELTA=$((CURRENT - PREV))
  
  if [ "$PREV" -eq 0 ]; then
    STATUS="(baseline)"
  elif [ "$DELTA" -gt 25000 ]; then
    STATUS="🔴 RUNNING — DO active, billing"
  elif [ "$DELTA" -gt 5000 ]; then
    STATUS="🟡 WINDING DOWN"
  else
    STATUS="🟢 HIBERNATED — no charges"
  fi
  
  printf "%-12s %-14s %-12s %s\n" "$NOW" "${CURRENT}ms" "+${DELTA}ms" "$STATUS"
  PREV=$CURRENT
  sleep 30
done
