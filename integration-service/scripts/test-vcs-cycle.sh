#!/usr/bin/env bash
# Test script: end-to-end VCS key lifecycle
# Preconditions: Integration service & Playground running, env secrets set.
set -euo pipefail
BASE=${BASE_URL:-http://localhost:3001/api/vcs}
PLAY=${PLAYGROUND_URL:-http://localhost:8000}

info(){ echo -e "[INFO] $*"; }
fail(){ echo -e "[ERROR] $*" >&2; exit 1; }

info "Generate key";
GEN=$(curl -s -X POST "$BASE/generate") || fail "generate failed";
FP=$(echo "$GEN" | jq -r '.data.fingerprint')
[[ "$FP" != null ]] || fail "fingerprint missing";
info "Fingerprint: $FP";

info "Activate key";
ACT=$(curl -s -X POST "$BASE/activate/$FP") || fail "activate failed";

info "Redistribute (should succeed)";
RED=$(curl -s -X POST "$BASE/distribute/$FP") || fail "redistribute failed";

info "Test connection via integration service";
TEST=$(curl -s -X POST "$BASE/test-connection") || fail "test failed";

info "Playground status";
PSTAT=$(curl -s "$PLAY/vcs/status") || fail "playground status failed";

info "Metrics snapshot";
MET=$(curl -s "$BASE/metrics" | grep vcs_keys_generated_total || true);

info "Done";
exit 0;
