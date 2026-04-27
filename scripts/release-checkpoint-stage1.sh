#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
OUTPUT_DIR="${ROOT_DIR}/.backups/release-checkpoints/${TIMESTAMP}"
CREATE_TAG=0

while (($#)); do
  case "$1" in
    --tag)
      CREATE_TAG=1
      shift
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash ./scripts/release-checkpoint-stage1.sh [--tag] [--output-dir <path>]"
      exit 1
      ;;
  esac
done

META_DIR="${OUTPUT_DIR}/meta"
LOGS_DIR="${OUTPUT_DIR}/logs"
SERVER_JSON_DIR="${OUTPUT_DIR}/server-json"
DB_DUMP_DIR="${OUTPUT_DIR}/db-dump"

mkdir -p "${META_DIR}" "${LOGS_DIR}" "${SERVER_JSON_DIR}" "${DB_DUMP_DIR}"

echo "==> Stage 1 release checkpoint"
echo "Root: ${ROOT_DIR}"
echo "Output: ${OUTPUT_DIR}"

{
  echo "timestamp=${TIMESTAMP}"
  echo "root_dir=${ROOT_DIR}"
  echo "output_dir=${OUTPUT_DIR}"
} > "${META_DIR}/checkpoint_meta.env"

echo "==> Capturing git state"
git -C "${ROOT_DIR}" status --short --branch | tee "${META_DIR}/git_status_branch.txt"
git -C "${ROOT_DIR}" rev-parse HEAD | tee "${META_DIR}/git_commit_full.txt"
git -C "${ROOT_DIR}" rev-parse --short HEAD | tee "${META_DIR}/git_commit_short.txt"
git -C "${ROOT_DIR}" diff > "${META_DIR}/uncommitted.diff" || true
git -C "${ROOT_DIR}" diff --staged > "${META_DIR}/staged.diff" || true

echo "==> Loading .env (if exists)"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
  echo "Loaded ${ROOT_DIR}/.env" | tee "${META_DIR}/env_load.txt"
else
  echo "No .env file found in project root" | tee "${META_DIR}/env_load.txt"
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  if [[ -x "/opt/homebrew/opt/libpq/bin/pg_dump" ]]; then
    export PATH="/opt/homebrew/opt/libpq/bin:${PATH}"
    echo "Using pg_dump from /opt/homebrew/opt/libpq/bin" | tee -a "${META_DIR}/env_load.txt"
  fi
fi

echo "==> Running smoke test"
SMOKE_STATUS="ok"
if ! (
  cd "${ROOT_DIR}"
  npm run smoke:server
) 2>&1 | tee "${LOGS_DIR}/01_smoke.log"; then
  SMOKE_STATUS="failed"
fi
echo "smoke_status=${SMOKE_STATUS}" | tee "${META_DIR}/smoke_status.txt"

echo "==> Running admin JSON snapshot backup (if credentials exist)"
BACKUP_STATUS="skipped"
if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  BACKUP_OUTPUT_ROOT="${OUTPUT_DIR}/server-json-raw"
  if (
    cd "${ROOT_DIR}"
    node ./scripts/backup-server-snapshots.mjs "${BACKUP_OUTPUT_ROOT}"
  ) 2>&1 | tee "${LOGS_DIR}/02_admin_backup.log"; then
    LATEST_SNAPSHOT_DIR="$(find "${BACKUP_OUTPUT_ROOT}" -maxdepth 1 -type d -name 'snapshot_*' | sort | tail -n 1 || true)"
    if [[ -n "${LATEST_SNAPSHOT_DIR}" && -d "${LATEST_SNAPSHOT_DIR}" ]]; then
      cp -R "${LATEST_SNAPSHOT_DIR}/." "${SERVER_JSON_DIR}/"
      echo "${LATEST_SNAPSHOT_DIR}" > "${META_DIR}/latest_json_snapshot_path.txt"
      BACKUP_STATUS="ok"
    else
      BACKUP_STATUS="failed_no_snapshot_folder"
    fi
  else
    BACKUP_STATUS="failed"
  fi
else
  echo "ADMIN_EMAIL/ADMIN_PASSWORD not set; JSON backup skipped" | tee "${LOGS_DIR}/02_admin_backup.log"
fi
echo "backup_status=${BACKUP_STATUS}" | tee "${META_DIR}/backup_status.txt"

echo "==> Running PostgreSQL dump (if url + tools exist)"
DB_DUMP_STATUS="skipped"
DB_URL="${DATABASE_URL_EXTERNAL:-${DATABASE_URL:-}}"
if [[ -z "${DB_URL}" ]]; then
  echo "DATABASE_URL_EXTERNAL or DATABASE_URL not set; DB dump skipped" | tee "${LOGS_DIR}/03_db_dump.log"
else
  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump is not installed; DB dump skipped" | tee "${LOGS_DIR}/03_db_dump.log"
    DB_DUMP_STATUS="skipped_no_pg_dump"
  else
    DUMP_FILE="${DB_DUMP_DIR}/render_${TIMESTAMP}.dump"
    if pg_dump "${DB_URL}" -Fc -f "${DUMP_FILE}" 2>&1 | tee "${LOGS_DIR}/03_db_dump.log"; then
      echo "${DUMP_FILE}" > "${META_DIR}/db_dump_file.txt"
      DB_DUMP_STATUS="ok"
      if command -v pg_restore >/dev/null 2>&1; then
        pg_restore -l "${DUMP_FILE}" | head -n 50 > "${LOGS_DIR}/04_pg_restore_list_head.log" || true
      fi
    else
      DB_DUMP_STATUS="failed"
    fi
  fi
fi
echo "db_dump_status=${DB_DUMP_STATUS}" | tee "${META_DIR}/db_dump_status.txt"

echo "==> Computing checksums and creating archive"
(
  cd "${OUTPUT_DIR}"
  find . -type f -print0 | xargs -0 shasum -a 256 > "${META_DIR}/checksums.sha256"
)

ARCHIVE_PATH="${OUTPUT_DIR}.tar.gz"
tar -czf "${ARCHIVE_PATH}" -C "$(dirname "${OUTPUT_DIR}")" "$(basename "${OUTPUT_DIR}")"
echo "${ARCHIVE_PATH}" > "${META_DIR}/archive_path.txt"

TAG_STATUS="skipped"
if [[ "${CREATE_TAG}" -eq 1 ]]; then
  TAG_NAME="pre-appstore-${TIMESTAMP}"
  if git -C "${ROOT_DIR}" tag -a "${TAG_NAME}" -m "Pre-AppStore restore point ${TIMESTAMP}" &&
    git -C "${ROOT_DIR}" push origin "${TAG_NAME}"; then
    TAG_STATUS="ok"
    echo "${TAG_NAME}" > "${META_DIR}/git_tag.txt"
  else
    TAG_STATUS="failed"
  fi
fi
echo "tag_status=${TAG_STATUS}" | tee "${META_DIR}/tag_status.txt"

{
  echo "smoke_status=${SMOKE_STATUS}"
  echo "backup_status=${BACKUP_STATUS}"
  echo "db_dump_status=${DB_DUMP_STATUS}"
  echo "tag_status=${TAG_STATUS}"
  echo "output_dir=${OUTPUT_DIR}"
  echo "archive_path=${ARCHIVE_PATH}"
} > "${META_DIR}/summary.txt"

echo
echo "==> Stage 1 checkpoint complete"
cat "${META_DIR}/summary.txt"
