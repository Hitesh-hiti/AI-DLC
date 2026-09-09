import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS


# ============================================================
# Configuration
# ============================================================

load_dotenv()

INFLUX_URL = os.getenv("INFLUX_URL", "http://localhost:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "kiro-local-token-2026")
INFLUX_ORG = os.getenv("INFLUX_ORG", "kiro")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "usage")

KIRO_HOME = Path(
    os.getenv(
        "KIRO_HOME",
        str(Path.home() / ".kiro")
    )
)

SESSIONS_DIR = KIRO_HOME / "sessions"
LOGS_DIR = KIRO_HOME / "logs"

POLL_SECONDS = int(os.getenv("POLL_SECONDS", "10"))
BILLING_LIMIT = float(os.getenv("BILLING_LIMIT", "50"))


# ============================================================
# Timestamp
# ============================================================

def parse_timestamp(value):
    if not value:
        return datetime.now(timezone.utc)

    try:
        value = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        return dt.astimezone(timezone.utc)

    except Exception:
        return datetime.now(timezone.utc)


# ============================================================
# Usage parsing
# ============================================================

def extract_usage(record):
    """
    Extract a Kiro usage_summary record.

    Expected structure:

    {
        "timestamp": "...",
        "payload": {
            "type": "usage_summary",
            "executionId": "...",
            "promptTurnSummaries": [
                {
                    "unit": "credit",
                    "usage": 0.123
                }
            ],
            "elapsedTime": 8605,
            "status": "success"
        }
    }
    """

    payload = record.get("payload", {})

    if payload.get("type") != "usage_summary":
        return None

    execution_id = payload.get("executionId")

    if not execution_id:
        return None

    credits = 0.0

    for summary in payload.get("promptTurnSummaries", []):
        try:
            credits += float(summary.get("usage", 0))
        except (TypeError, ValueError):
            continue

    elapsed_ms = payload.get("elapsedTime", 0)

    try:
        elapsed_seconds = float(elapsed_ms) / 1000.0
    except (TypeError, ValueError):
        elapsed_seconds = 0.0

    return {
        "execution_id": execution_id,
        "timestamp": parse_timestamp(record.get("timestamp")),
        "credits": credits,
        "unit": "credit",
        "elapsed_seconds": elapsed_seconds,
        "status": payload.get("status", "unknown"),
    }


# ============================================================
# Session usage discovery
# ============================================================

def find_executions():
    """
    Read all messages.jsonl files and return usage_summary records.
    """

    executions = []

    if not SESSIONS_DIR.exists():
        return executions

    for message_file in SESSIONS_DIR.rglob("messages.jsonl"):
        try:
            with message_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as f:

                for line in f:
                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    usage = extract_usage(record)

                    if usage:
                        executions.append(usage)

        except Exception as exc:
            print(
                f"[WARN] Failed reading {message_file}: {exc}"
            )

    return executions


# ============================================================
# Runtime model discovery
# ============================================================

MODEL_PATTERN = re.compile(
    r"GenerateAssistantResponse\s+modelId=([^\s]+)"
)

EXECUTION_PATTERN = re.compile(
    r"\bexecutionId=([0-9a-fA-F-]{36})"
)


def find_runtime_model(execution_id):
    """
    Find the model Kiro actually used for an execution.

    We deliberately use the exact Kiro execution/turn ID.

    Example:

        turnId=2db04464...
        GenerateAssistantResponse modelId=claude-haiku-4.5

    Returns:
        claude-haiku-4.5
        auto
        unknown
    """

    if not LOGS_DIR.exists():
        return "unknown"

    for log_file in LOGS_DIR.rglob("*.log"):

        try:
            with log_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as f:

                for line in f:

                    if execution_id not in line:
                        continue

                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    turn_id = record.get("turnId")
                    root_turn_id = record.get("rootTurnId")

                    # Exact execution match.
                    if (
                        turn_id != execution_id
                        and root_turn_id != execution_id
                    ):
                        continue

                    message = record.get("message", "")

                    match = MODEL_PATTERN.search(message)

                    if match:
                        return match.group(1)

        except Exception:
            continue

    return "unknown"


# ============================================================
# Router telemetry
# ============================================================

ROUTER_EVENT_PATTERN = re.compile(
    r"KIRO_ROUTING_EVENT\s+(.+)"
)


def parse_router_telemetry(message):
    """
    Parse machine-readable router telemetry.

    Expected:

        KIRO_ROUTING_EVENT
        execution_id=...
        session_id=...
        phase=REQUIREMENT
        agent=Design Agent
        routed_model=claude-sonnet-4-5
        confidence=HIGH
        reason=...
    """

    if "KIRO_ROUTING_EVENT" not in message:
        return None

    telemetry = {}

    # Capture key=value pairs.
    #
    # Values can contain spaces.
    patterns = {
        "execution_id": r"execution_id=([0-9a-fA-F-]{36})",
        "session_id": r"session_id=([^\s]+)",
        "phase": r"phase=([A-Z_]+)",
        "agent": r"agent=(.*?)(?=\s+routed_model=|\s+confidence=|\s+reason=|$)",
        "routed_model": r"routed_model=([^\s]+)",
        "confidence": r"confidence=([^\s]+)",
        "reason": r"reason=(.*)$",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, message)

        if match:
            telemetry[key] = match.group(1).strip()

    if not telemetry.get("execution_id"):
        return None

    return telemetry


def find_router_telemetry():
    """
    Read router telemetry from Kiro messages.jsonl.

    Returns:

        {
            execution_id: {
                phase: ...,
                agent: ...,
                routed_model: ...,
                confidence: ...,
                reason: ...
            }
        }
    """

    result = {}

    if not SESSIONS_DIR.exists():
        return result

    for message_file in SESSIONS_DIR.rglob("messages.jsonl"):

        try:
            with message_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as f:

                for line in f:

                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    payload = record.get("payload", {})

                    if payload.get("type") != "assistant":
                        continue

                    content = payload.get("content", "")

                    if not isinstance(content, str):
                        continue

                    telemetry = parse_router_telemetry(content)

                    if telemetry:
                        execution_id = telemetry["execution_id"]

                        result[execution_id] = telemetry

        except Exception as exc:
            print(
                f"[WARN] Failed reading router telemetry "
                f"{message_file}: {exc}"
            )

    return result


# ============================================================
# Session model
# ============================================================

def find_session_model(execution_id):
    """
    Find the model selected for the Kiro session containing
    the execution.

    This is informational only.

    Runtime model remains the authoritative model.
    """

    if not SESSIONS_DIR.exists():
        return "unknown"

    target_session = None

    # First find the session containing the execution.
    for message_file in SESSIONS_DIR.rglob("messages.jsonl"):

        try:
            with message_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as f:

                for line in f:

                    if execution_id not in line:
                        continue

                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    payload = record.get("payload", {})

                    if payload.get("executionId") == execution_id:
                        target_session = message_file
                        break

            if target_session:
                break

        except Exception:
            continue

    if not target_session:
        return "unknown"

    # Inspect session metadata.
    try:
        with target_session.open(
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as f:

            for line in f:

                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                payload = record.get("payload", {})

                # Some Kiro records expose model metadata here.
                value = payload.get("value")

                if isinstance(value, dict):

                    model = (
                        value.get("modelId")
                        or value.get("model")
                    )

                    if model:
                        return model

    except Exception:
        pass

    return "unknown"


# ============================================================
# Influx helpers
# ============================================================

def load_existing_ids(client):
    """
    Return execution IDs already stored in InfluxDB.
    """

    query_api = client.query_api()

    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: 0)
      |> filter(fn: (r) => r._measurement == "kiro_execution")
      |> keep(columns: ["execution_id"])
      |> distinct(column: "execution_id")
    '''

    existing = set()

    try:
        tables = query_api.query(
            query=query,
            org=INFLUX_ORG
        )

        for table in tables:
            for record in table.records:
                value = record.get_value()

                if value:
                    existing.add(value)

    except Exception as exc:
        print(
            f"[WARN] Failed loading existing execution IDs: {exc}"
        )

    return existing


# ============================================================
# Write execution
# ============================================================

def write_execution(
    write_api,
    execution,
    router_event=None
):
    """
    Write one execution to InfluxDB.

    Important distinction:

        session_model
            Model selected by the current Kiro session.

        routed_model
            Model selected by your router.

        runtime_model
            Model Kiro actually used.

    runtime_model is authoritative for usage.
    """

    execution_id = execution["execution_id"]

    runtime_model = execution.get(
        "runtime_model",
        "unknown"
    )

    routed_agent = "unknown"
    routed_model = "unknown"
    phase = "UNKNOWN"
    confidence = "UNKNOWN"

    if router_event:

        routed_agent = router_event.get(
            "agent",
            "unknown"
        )

        routed_model = router_event.get(
            "routed_model",
            "unknown"
        )

        phase = router_event.get(
            "phase",
            "UNKNOWN"
        )

        confidence = router_event.get(
            "confidence",
            "UNKNOWN"
        )

    point = (
        Point("kiro_execution")
        .tag("execution_id", execution_id)
        .tag("runtime_model", runtime_model)
        .tag("model", runtime_model)
        .tag("status", execution["status"])
        .tag("phase", phase)
        .tag("routed_agent", routed_agent)
        .tag("routed_model", routed_model)
        .tag("routing_confidence", confidence)
        .field("credits", float(execution["credits"]))
        .field("billing_limit", BILLING_LIMIT)
        .field(
            "elapsed_seconds",
            float(execution["elapsed_seconds"])
        )
        .time(execution["timestamp"])
    )

    write_api.write(
        bucket=INFLUX_BUCKET,
        org=INFLUX_ORG,
        record=point
    )


# ============================================================
# Collection
# ============================================================

def collect_once(client, write_api):
    executions = find_executions()

    if not executions:
        print("[INFO] No executions found.")
        return

    existing_ids = load_existing_ids(client)

    router_events = find_router_telemetry()

    new_count = 0

    for execution in executions:

        execution_id = execution["execution_id"]

        if execution_id in existing_ids:
            continue

        runtime_model = find_runtime_model(
            execution_id
        )

        execution["runtime_model"] = runtime_model

        router_event = router_events.get(
            execution_id
        )

        write_execution(
            write_api,
            execution,
            router_event
        )

        routed_agent = (
            router_event.get("agent", "unknown")
            if router_event
            else "unknown"
        )

        routed_model = (
            router_event.get("routed_model", "unknown")
            if router_event
            else "unknown"
        )

        phase = (
            router_event.get("phase", "UNKNOWN")
            if router_event
            else "UNKNOWN"
        )

        print(
            f"[COLLECTED] "
            f"{execution_id} | "
            f"phase={phase} | "
            f"agent={routed_agent} | "
            f"routed_model={routed_model} | "
            f"runtime_model={runtime_model} | "
            f"credits={execution['credits']:.6f} | "
            f"duration={execution['elapsed_seconds']:.3f}s | "
            f"status={execution['status']}"
        )

        new_count += 1

    if new_count == 0:
        print("[INFO] No new executions.")


# ============================================================
# Main
# ============================================================

def main():

    print("=" * 72)
    print("KIRO USAGE COLLECTOR")
    print("=" * 72)

    print(f"Kiro home : {KIRO_HOME}")
    print(f"Sessions  : {SESSIONS_DIR}")
    print(f"Logs      : {LOGS_DIR}")
    print(f"Influx    : {INFLUX_URL}")
    print(f"Bucket    : {INFLUX_BUCKET}")
    print(f"Poll      : {POLL_SECONDS}s")
    print()

    client = InfluxDBClient(
        url=INFLUX_URL,
        token=INFLUX_TOKEN,
        org=INFLUX_ORG
    )

    try:

        health = client.health()

        print(
            f"[INFO] InfluxDB: {health.status}"
        )

        write_api = client.write_api(
            write_options=SYNCHRONOUS
        )

        while True:

            try:
                collect_once(
                    client,
                    write_api
                )

            except Exception as exc:
                print(
                    f"[ERROR] Collection failed: {exc}"
                )

            time.sleep(POLL_SECONDS)

    except KeyboardInterrupt:

        print("\n[INFO] Collector stopped.")

    finally:

        client.close()


if __name__ == "__main__":
    main()