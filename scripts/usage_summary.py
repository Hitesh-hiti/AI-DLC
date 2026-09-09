from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import json
import calendar
import re


# ============================================================
# CONFIGURATION
# ============================================================

KIRO_SESSIONS = Path.home() / ".kiro" / "sessions"
KIRO_LOGS = Path.home() / ".kiro" / "logs"

CREDIT_LIMIT = 50.0

# Kiro currently shows:
# "Estimated Usage resets on 10/01"
#
# Therefore:
#   Billing period = 2026-09-01 00:00:00
#                    through
#                    2026-10-01 00:00:00
#
# Set RESET_MONTH / RESET_DAY when the Kiro UI changes.
RESET_MONTH = 10
RESET_DAY = 1


# ============================================================
# DATE HELPERS
# ============================================================

def get_billing_period():
    """
    Determine the current billing period based on the configured
    Kiro usage reset date.

    If reset is October 1:
        Sep 1 -> Oct 1
    """

    now = datetime.now(timezone.utc)

    reset_this_year = datetime(
        now.year,
        RESET_MONTH,
        RESET_DAY,
        tzinfo=timezone.utc,
    )

    if now < reset_this_year:
        reset_end = reset_this_year
    else:
        # Next year's reset
        reset_end = datetime(
            now.year + 1,
            RESET_MONTH,
            RESET_DAY,
            tzinfo=timezone.utc,
        )

    # Previous reset
    if RESET_MONTH == 1:
        previous_year = reset_end.year - 1
        previous_month = 12
    else:
        previous_year = reset_end.year
        previous_month = RESET_MONTH - 1

    # For a reset on the first day of the month, previous period
    # starts on the first day of the previous month.
    reset_start = datetime(
        previous_year,
        previous_month,
        RESET_DAY,
        tzinfo=timezone.utc,
    )

    return reset_start, reset_end


# ============================================================
# MODEL LOOKUP
# ============================================================

def load_model_map():
    """
    Build:
        executionId -> modelId

    Kiro logs contain lines such as:

        GenerateAssistantResponse modelId=claude-haiku-4.5

    The execution/turn ID is stored separately as turnId.
    """

    models = {}

    if not KIRO_LOGS.exists():
        return models

    pattern = re.compile(
        r"GenerateAssistantResponse\s+modelId=([^\s]+)"
    )

    for log_file in KIRO_LOGS.rglob("*.log"):
        try:
            with log_file.open(
                "r",
                encoding="utf-8",
                errors="ignore",
            ) as f:

                for line in f:
                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    message = obj.get("message", "")

                    match = pattern.search(message)

                    if match:
                        execution_id = obj.get("turnId")

                        if execution_id:
                            models[execution_id] = match.group(1)

        except OSError:
            continue

    return models


# ============================================================
# USAGE READER
# ============================================================

def load_executions():
    """
    Read Kiro messages.jsonl files and extract usage_summary records.
    """

    executions = []

    if not KIRO_SESSIONS.exists():
        print(f"Kiro sessions directory not found:")
        print(KIRO_SESSIONS)
        return executions

    for session_file in KIRO_SESSIONS.rglob("messages.jsonl"):

        try:
            with session_file.open(
                "r",
                encoding="utf-8",
                errors="ignore",
            ) as f:

                for line in f:

                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    payload = obj.get("payload", {})

                    if payload.get("type") != "usage_summary":
                        continue

                    execution_id = payload.get("executionId")

                    timestamp = obj.get("timestamp")

                    if not timestamp:
                        continue

                    try:
                        timestamp_dt = datetime.fromisoformat(
                            timestamp.replace("Z", "+00:00")
                        )
                    except ValueError:
                        continue

                    summaries = payload.get(
                        "promptTurnSummaries",
                        []
                    )

                    # A single execution can contain multiple
                    # usage entries/model calls.
                    #
                    # IMPORTANT:
                    # Do NOT treat each entry as a separate execution.
                    # Sum them into one execution.
                    credits = 0.0
                    units = set()
                    used_tools = []

                    for summary in summaries:

                        usage = summary.get("usage")

                        if isinstance(usage, (int, float)):
                            credits += float(usage)

                        unit = summary.get("unit")

                        if unit:
                            units.add(unit)

                        tools = summary.get("usedTools")

                        if isinstance(tools, list):
                            used_tools.extend(tools)

                    elapsed_ms = payload.get(
                        "elapsedTime",
                        0
                    )

                    try:
                        elapsed_seconds = (
                            float(elapsed_ms) / 1000
                        )
                    except (TypeError, ValueError):
                        elapsed_seconds = 0.0

                    executions.append({
                        "timestamp": timestamp_dt,
                        "executionId": execution_id,
                        "credits": credits,
                        "elapsedSeconds": elapsed_seconds,
                        "status": payload.get("status"),
                        "unit": ", ".join(sorted(units)),
                        "usedTools": sorted(set(used_tools)),
                        "sessionFile": str(session_file),
                    })

        except OSError as e:
            print(f"Could not read {session_file}: {e}")

    return executions


# ============================================================
# DEDUPLICATION
# ============================================================

def deduplicate_executions(executions):
    """
    De-duplicate usage records by executionId.
    """

    unique = {}

    for execution in executions:

        execution_id = execution.get("executionId")

        if execution_id:
            unique[execution_id] = execution
        else:
            key = (
                execution["timestamp"],
                execution["credits"],
                execution["sessionFile"],
            )

            unique[key] = execution

    return list(unique.values())


# ============================================================
# BILLING PERIOD FILTER
# ============================================================

def get_current_billing_executions(executions):
    start, end = get_billing_period()

    return [
        execution
        for execution in executions
        if start <= execution["timestamp"] < end
    ]


# ============================================================
# STATISTICS
# ============================================================

def calculate_statistics(executions):

    total_credits = sum(
        execution["credits"]
        for execution in executions
    )

    execution_count = len(executions)

    total_time = sum(
        execution["elapsedSeconds"]
        for execution in executions
    )

    average_time = (
        total_time / execution_count
        if execution_count
        else 0
    )

    remaining = max(
        CREDIT_LIMIT - total_credits,
        0
    )

    percentage = (
        total_credits / CREDIT_LIMIT * 100
        if CREDIT_LIMIT
        else 0
    )

    credits_by_model = defaultdict(float)

    # Model gets attached later.
    for execution in executions:

        model = execution.get(
            "model",
            "Unknown"
        )

        credits_by_model[model] += execution["credits"]

    return {
        "totalCredits": total_credits,
        "executionCount": execution_count,
        "totalTime": total_time,
        "averageTime": average_time,
        "remaining": remaining,
        "percentage": percentage,
        "creditsByModel": dict(credits_by_model),
    }


# ============================================================
# REPORT
# ============================================================

def print_report(
    all_executions,
    billing_executions,
):

    start, end = get_billing_period()

    stats = calculate_statistics(
        billing_executions
    )

    print()
    print("=" * 100)
    print("KIRO CREDIT USAGE")
    print("=" * 100)

    print()
    print("CURRENT BILLING PERIOD")
    print("-" * 100)

    print(
        f"Start       : "
        f"{start.strftime('%Y-%m-%d')}"
    )

    print(
        f"Reset       : "
        f"{end.strftime('%Y-%m-%d')}"
    )

    print(
        f"Total limit : "
        f"{CREDIT_LIMIT:.2f} credits"
    )

    print(
        f"Credits used: "
        f"{stats['totalCredits']:.2f} credits"
    )

    print(
        f"Remaining   : "
        f"{stats['remaining']:.2f} credits"
    )

    print(
        f"Usage       : "
        f"{stats['percentage']:.2f}%"
    )

    print(
        f"Executions  : "
        f"{stats['executionCount']}"
    )

    print(
        f"Avg time    : "
        f"{stats['averageTime']:.2f} sec"
    )

    print()
    print("CREDITS BY MODEL")
    print("-" * 100)

    for model, credits in sorted(
        stats["creditsByModel"].items(),
        key=lambda x: x[1],
        reverse=True,
    ):
        print(
            f"{model:<35}"
            f"{credits:.6f} credits"
            f"  ({credits:.2f})"
        )

    print()
    print("LATEST EXECUTIONS")
    print("-" * 100)

    print(
        f"{'Time':<25}"
        f"{'Model':<25}"
        f"{'Credits':>12}"
        f"{'Elapsed':>12}"
        f"{'Status':>10}"
    )

    print("-" * 100)

    sorted_executions = sorted(
        billing_executions,
        key=lambda x: x["timestamp"],
        reverse=True,
    )

    for execution in sorted_executions[:30]:

        timestamp = execution["timestamp"].strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        model = execution.get(
            "model",
            "Unknown"
        )

        print(
            f"{timestamp:<25}"
            f"{model:<25}"
            f"{execution['credits']:>12.6f}"
            f"{execution['elapsedSeconds']:>12.2f}"
            f"{str(execution['status']):>10}"
        )

    print("=" * 100)

    print()
    print(
        f"All stored executions: "
        f"{len(all_executions)}"
    )

    print()


# ============================================================
# SAVE JSON
# ============================================================

def save_json(
    all_executions,
    billing_executions,
):

    start, end = get_billing_period()

    stats = calculate_statistics(
        billing_executions
    )

    output = {
        "generatedAt": datetime.now(
            timezone.utc
        ).isoformat(),

        "billingPeriod": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },

        "account": {
            "creditLimit": CREDIT_LIMIT,
            "creditsUsed": stats["totalCredits"],
            "creditsRemaining": stats["remaining"],
            "usagePercent": stats["percentage"],
        },

        "summary": {
            "executionCount": stats["executionCount"],
            "totalExecutionTimeSeconds": stats["totalTime"],
            "averageExecutionTimeSeconds": stats["averageTime"],
            "creditsByModel": stats["creditsByModel"],
        },

        "executions": [
            {
                **execution,
                "timestamp": execution["timestamp"].isoformat(),
                "estCredits": round(
                    execution["credits"],
                    2
                ),
            }
            for execution in billing_executions
        ],
    }

    output_file = Path(
        __file__
    ).with_name(
        "kiro_usage_report.json"
    )

    with output_file.open(
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            output,
            f,
            indent=2,
        )

    print(
        f"JSON report: {output_file}"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        f"Reading Kiro sessions from:\n"
        f"{KIRO_SESSIONS}\n"
    )

    # 1. Find models from Kiro logs.
    model_map = load_model_map()

    # 2. Read usage summaries.
    executions = load_executions()

    # 3. De-duplicate.
    executions = deduplicate_executions(
        executions
    )

    # 4. Attach model.
    for execution in executions:

        execution_id = execution.get(
            "executionId"
        )

        execution["model"] = (
            model_map.get(
                execution_id,
                "Unknown"
            )
        )

    # 5. Current billing period.
    billing_executions = (
        get_current_billing_executions(
            executions
        )
    )

    # 6. Display.
    print_report(
        executions,
        billing_executions,
    )

    # 7. Save machine-readable report.
    save_json(
        executions,
        billing_executions,
    )


if __name__ == "__main__":
    main()