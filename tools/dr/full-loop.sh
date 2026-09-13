#!/usr/bin/env bash
# DR full-loop driver (D245-D248). Operator script, not a runner module.
#
# CLAUDE.md: long jobs run as a loop script with state on disk, never turn by
# turn, because sessions restart. This drives `run.mjs` one chunk of batches at a
# time, keeps cumulative spend and the P6 verdict in a JSON state file, and is
# safe to re-run: `run.mjs` resume keys off (run_id, dictionary_id) and skips
# rows already staged.
#
#   D246  P6 is re-read after each chunk until its denominator is readable
#         (n>=50 low-band rows, ~300 rows). A FAIL there halts the run with the
#         balance still able to fund a re-prompted second pass.
#   D247  $36.00 is a CUMULATIVE ceiling. run.mjs's own `spent()` counts one
#         invocation (run.mjs:194), so the remainder is computed here and passed
#         down per chunk. On the judge-cli transport the figure it caps is a
#         LIST-PRICE EQUIVALENT of Claude Code allowance, not a card charge
#         (D249) — the number is unchanged and is still a hard stop.
#   D248  batch size stays 60.
#   D249  transport is judge-cli. Run it with the API key removed from the
#         environment, so the billing path cannot execute even by mistake:
#
#             env -u DR_ANTHROPIC_KEY bash tools/dr/full-loop.sh <run-id>
#
#         judge.mjs readKey() throws on an absent DR_ANTHROPIC_KEY with no
#         fallback variable, so anthropic-direct fails loudly and stages nothing.
#         The pre-flight below refuses to start if the key is present at all.
#
# Usage: env -u DR_ANTHROPIC_KEY tools/dr/full-loop.sh [run-id]
# Resume: re-run with the same run id. Nothing is re-judged that is already staged.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

RUN_ID="${1:-dr-full-2026-09-13}"
CEILING=36.00          # D247 cumulative ceiling
STAGE1_CAP=4.00        # D247: chunk 1, the D246 checkpoint window
# 2, not 5: three batches are already staged (two on the API, one the D249
# verification batch), so a 2-batch chunk lands the D246 P6 checkpoint at planned
# batch 5 — 300 rows — exactly where D246 puts it.
CHUNK_BATCHES=2
BATCH_SIZE=60          # D248
MAX_CHUNKS=20          # a safety stop, not a target
TRANSPORT=judge-cli    # D249
# Batches this run is authorised to execute, across all chunks. 120 rows are
# already staged, so 6 more batches lands at 480 rows — the closest stop under
# the 500 Marwan set. Not the full 2,728: this run exists to produce numbers.
BATCH_BUDGET=6
# Offline rehearsal only: --rows-from/--judge-from/--no-stage, so the driver's
# chunking, state file and cumulative arithmetic can be exercised without spend.
# Empty in every real run. There is deliberately no hook that skips the D246 gate.
EXTRA_ARGS="${DR_RUN_EXTRA_ARGS:-}"

RUN_DIR="runs/$RUN_ID"
STATE="$RUN_DIR/loop-state.json"
CHUNKS="$RUN_DIR/chunks"
LOG="$RUN_DIR/loop.log"
mkdir -p "$CHUNKS"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

# --- state -----------------------------------------------------------------
# Read before anything else so a restart picks up where the last one stopped.
read_state() {
  if [ -f "$STATE" ]; then
    SPENT=$(node -e "console.log(require('$REPO_ROOT/$STATE').spent_usd)")
    CHUNK=$(node -e "console.log(require('$REPO_ROOT/$STATE').chunks_done)")
    P6=$(node -e "console.log(require('$REPO_ROOT/$STATE').p6_verdict)")
    RAN=$(node -e "console.log(require('$REPO_ROOT/$STATE').batches_run ?? 0)")
  else
    SPENT=0; CHUNK=0; P6=not-yet-readable; RAN=0
  fi
}

write_state() {
  cat > "$STATE" <<JSON
{
  "run_id": "$RUN_ID",
  "spent_usd": $SPENT,
  "ceiling_usd": $CEILING,
  "chunks_done": $CHUNK,
  "batches_run": $RAN,
  "transport": "$TRANSPORT",
  "p6_verdict": "$P6",
  "status": "$1",
  "updated_at": "$(date -u +%FT%TZ)"
}
JSON
}

# --- pre-flight (D249) ------------------------------------------------------
# Fail closed before spending anything, not after. An intention to use the right
# transport is what failed the first time; these remove the capability instead.
if [ -n "${DR_ANTHROPIC_KEY:-}" ]; then
  echo "REFUSING TO START: DR_ANTHROPIC_KEY is present, so the card-billing path is reachable." >&2
  echo "Re-run as: env -u DR_ANTHROPIC_KEY bash tools/dr/full-loop.sh $RUN_ID" >&2
  exit 6
fi
if [ "$TRANSPORT" != "judge-cli" ]; then
  echo "REFUSING TO START: transport is '$TRANSPORT', expected judge-cli (D249)." >&2
  exit 6
fi

read_state
log "full loop $RUN_ID: resuming at chunk $CHUNK, spent \$$SPENT of \$$CEILING, p6=$P6"
log "transport=$TRANSPORT, DR_ANTHROPIC_KEY absent, batch budget $BATCH_BUDGET (stop at 480 rows)"

failures=0

while [ "$CHUNK" -lt "$MAX_CHUNKS" ]; do
  # Cumulative ceiling (D247). Chunk 1 gets the smaller D246 checkpoint window.
  remaining=$(awk -v c="$CEILING" -v s="$SPENT" 'BEGIN{printf "%.2f", c-s}')
  if awk -v r="$remaining" 'BEGIN{exit !(r <= 0.50)}'; then
    log "HALT: only \$$remaining left under the \$$CEILING ceiling — not enough for a batch"
    write_state ceiling-reached; exit 4
  fi
  if [ "$CHUNK" -eq 0 ]; then
    cap="$STAGE1_CAP"
  else
    cap="$remaining"
  fi

  # D249 batch budget: this run stops at 480 rows, it does not go to 2,728.
  left=$((BATCH_BUDGET - RAN))
  if [ "$left" -le 0 ]; then
    log "STOP: batch budget $BATCH_BUDGET reached (480 rows). Not continuing to 2,728 — report time."
    write_state budget-reached; exit 0
  fi
  this_chunk=$CHUNK_BATCHES
  [ "$left" -lt "$this_chunk" ] && this_chunk=$left

  n=$((CHUNK + 1))
  log "chunk $n: --transport $TRANSPORT --max-batches $this_chunk --spend-cap $cap (cumulative \$$SPENT of \$$CEILING)"

  NODE_USE_ENV_PROXY=1 node tools/dr/run.mjs \
    --run-id "$RUN_ID" \
    --batch-size "$BATCH_SIZE" \
    --max-batches "$this_chunk" \
    --transport "$TRANSPORT" \
    --spend-cap "$cap" $EXTRA_ARGS >>"$LOG" 2>&1
  rc=$?

  # rc 2 is "a report check did not pass" — expected on a partial chunk (P5, P6,
  # P10 are whole-run reads) and never a reason to stop. rc 1 is a halt.
  if [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
    failures=$((failures + 1))
    log "chunk $n: run.mjs exited $rc (failure $failures)"
    if [ "$failures" -ge 2 ]; then
      log "HALT: two consecutive chunk failures. Nothing is lost — re-run this script to resume."
      write_state halted-run-error; exit 1
    fi
    sleep 120
    continue
  fi
  failures=0

  # Archive this invocation's artefacts: run.mjs rewrites report.json per
  # invocation from that invocation's batches only, so a resumed run's final
  # report under-reports unless each chunk is kept.
  cp "$RUN_DIR/report.json" "$CHUNKS/report-$(printf '%02d' "$n").json" 2>/dev/null
  cp "$RUN_DIR/report.txt"  "$CHUNKS/report-$(printf '%02d' "$n").txt"  2>/dev/null

  chunk_usd=$(node -e "console.log(require('$REPO_ROOT/$RUN_DIR/report.json').totals.usd_spent)")
  stop_reason=$(node -e "console.log(require('$REPO_ROOT/$RUN_DIR/report.json').stop_reason)")
  ran_now=$(node -e "console.log(require('$REPO_ROOT/$RUN_DIR/report.json').totals.batches_run)")

  # D249 positive proof, per chunk: the run really went through the Claude Code
  # CLI on the pinned model. `metered: transport` can only be set by a response
  # that carried total_cost_usd, and the manifest records what was asked for.
  proof=$(node -e "
    const r=require('$REPO_ROOT/$RUN_DIR/report.json'), m=require('$REPO_ROOT/$RUN_DIR/manifest.json');
    const p8=r.checks.find(c=>c.id==='P8')?.value ?? {};
    console.log(JSON.stringify({transport:m.transport, model:m.model, metered:p8.metered}));
  ")
  log "proof: $proof"
  if ! printf '%s' "$proof" | grep -q '"transport":"judge-cli"'; then
    log "HALT: manifest transport is not judge-cli. Refusing to continue."
    write_state halted-wrong-transport; exit 6
  fi
  if ! printf '%s' "$proof" | grep -q '"metered":\["transport"\]'; then
    log "HALT: a call was priced from D243's table, not the CLI envelope. Refusing to continue."
    write_state halted-unmetered; exit 6
  fi

  SPENT=$(awk -v a="$SPENT" -v b="$chunk_usd" 'BEGIN{printf "%.4f", a+b}')
  RAN=$((RAN + ran_now))
  CHUNK=$n
  log "chunk $n: \$$chunk_usd, cumulative \$$SPENT, batches_run $RAN/$BATCH_BUDGET, stop_reason=$stop_reason"

  # --- D246 P6 checkpoint --------------------------------------------------
  if [ "$P6" = "not-yet-readable" ]; then
    p6_json=$(NODE_USE_ENV_PROXY=1 node tools/dr/full-loop-p6.mjs "$RUN_ID" 2>>"$LOG")
    p6_rc=$?
    log "P6 after chunk $n: $p6_json"
    if [ "$p6_rc" -eq 3 ]; then
      P6=fail
      write_state halted-p6
      log "HALT (D246): P6 FAILs at a readable denominator. The prompt question goes to Marwan"
      log "             with \$$(awk -v c=$CEILING -v s=$SPENT 'BEGIN{printf \"%.2f\", c-s}') of the ceiling unspent."
      exit 3
    elif [ "$p6_rc" -eq 0 ]; then
      P6=$(node -e "console.log(JSON.parse(process.argv[1]).verdict)" "$p6_json" 2>/dev/null || echo not-yet-readable)
    fi
  fi

  write_state running

  if [ "$stop_reason" = "completed" ]; then
    log "DONE: every planned batch is staged. cumulative \$$SPENT of \$$CEILING, p6=$P6"
    write_state completed; exit 0
  fi
  if [ "$stop_reason" = "two-consecutive-batch-failures" ]; then
    log "HALT: run.mjs reports two consecutive batch failures (D240)."
    write_state halted-batch-failures; exit 1
  fi
done

log "HALT: chunk ceiling $MAX_CHUNKS reached without completing. Re-run to continue."
write_state halted-max-chunks
exit 5
