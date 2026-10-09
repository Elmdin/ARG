#!/usr/bin/env bash
# Polls the live team inbox and exits (printing them) as soon as any ask is "new".
# Claude runs this in the background; its exit wakes Claude to build the ask.
URL="${1:-https://arg-foundergame.vercel.app}/api/asks"
while true; do
  out=$(curl -s --max-time 10 "$URL" | python3 -c '
import json,sys
try: a=json.load(sys.stdin)["asks"]
except Exception: sys.exit(0)
n=[x for x in a if x["status"]=="new"]
if n: print(json.dumps(n, indent=1))' 2>/dev/null)
  if [ -n "$out" ]; then echo "$out"; exit 0; fi
  sleep 8
done
