#!/usr/bin/env bash
set -euo pipefail

echo "-- health checks"
curl -fsS http://localhost:8101/health && echo
curl -fsS http://localhost:8102/health && echo
curl -fsS http://localhost:8103/health && echo

echo "-- tiny calls"
curl -fsS -X POST http://localhost:8101/animate -H 'Content-Type: application/json' -d '{"prompt":"waves","seconds":2,"fps":12}' && echo
curl -fsS -X POST http://localhost:8102/interpolate -H 'Content-Type: application/json' -d '{"video_url":"data:video/webm;base64,","factor":2}' && echo
curl -fsS -X POST http://localhost:8103/inpaint -H 'Content-Type: application/json' -d '{"prompt":"fill","image_url":"data:image/png;base64,","mask_url":"data:image/png;base64,"}' && echo


