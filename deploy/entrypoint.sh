#!/usr/bin/env bash
# 教智星 Web 运行入口：将 JZX_* 映射为运行时仍识别的环境变量后启动发行包。
set -euo pipefail

if [ ${#JZX_SERVER_AUTH_TOKEN} -lt 24 ] || [[ "$JZX_SERVER_AUTH_TOKEN" == *replace* ]] || [[ "$JZX_SERVER_AUTH_TOKEN" == *change-me* ]]; then
  echo "Deployment requires a generated test credential (at least 24 characters)." >&2
  exit 1
fi
: "${JZX_SERVER_AUTH_EXPIRES_AT:?Deployment requires an absolute access expiry}"

map_env() {
  local src="$1"
  local dst="$2"
  if [ -n "${!src:-}" ] && [ -z "${!dst:-}" ]; then
    export "$dst"="${!src}"
  fi
}

map_env JZX_SERVER_HOST ZCODE_SERVER_HOST
map_env JZX_SERVER_WORKSPACE ZCODE_SERVER_WORKSPACE
map_env JZX_SERVER_AUTH_TOKEN ZCODE_SERVER_AUTH_TOKEN
map_env JZX_WEB_STATIC_ROOT ZCODE_WEB_STATIC_ROOT
map_env JZX_AGENT_SERVER_COMMAND ZCODE_AGENT_SERVER_COMMAND

export ZCODE_SERVER_HOST="${ZCODE_SERVER_HOST:-0.0.0.0}"
export ZCODE_SERVER_WORKSPACE="${ZCODE_SERVER_WORKSPACE:-/workspace}"
export ZCODE_WEB_STATIC_ROOT="${ZCODE_WEB_STATIC_ROOT:-/app/web}"

HOST="${ZCODE_SERVER_HOST}"
PORT="${PORT:-3030}"
TOKEN_ARGS=()
if [ -n "${ZCODE_SERVER_AUTH_TOKEN:-}" ]; then
  TOKEN_ARGS=(--token "${ZCODE_SERVER_AUTH_TOKEN}")
fi

exec node /app/bin/zcode.mjs --web \
  --host "${HOST}" \
  --port "${PORT}" \
  --workspace "${ZCODE_SERVER_WORKSPACE}" \
  --no-open \
  "${TOKEN_ARGS[@]}"
