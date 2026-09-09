```python
import json
import csv
import re
from pathlib import Path
from datetime import datetime


# ============================================================
# KIRO USAGE REPORT
# ============================================================

HOME = Path.home()

# Kiro locations
LOGS_DIR = HOME / ".kiro" / "logs"
SESSIONS_DIR = HOME / ".kiro" / "sessions"

# Save output files next to this Python script
OUTPUT_DIR = Path(__file__).resolve().parent

JSON_FILE = OUTPUT_DIR / "usage_report.json"
CSV_FILE = OUTPUT_DIR / "usage_report.csv"


# ============================================================
# 1. BUILD executionId -> MODEL MAPPING
# ============================================================

print()
print("=" * 70)
print("STEP 1 - Reading Kiro logs")
print("=" * 70)

models = {}

model_pattern = re.compile(
    r"GenerateAssistantResponse\s+modelId=([^\s]+)"
)

log_count = 0
model_count = 0

if not LOGS_DIR.exists():
    print(f"WARNING: Kiro logs directory not found:")
    print(LOGS_DIR)
else:

    for log_file in LOGS_DIR.rglob("*.log"):

        log_count += 1

        try:

            with log_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as f:

                for line in f:

                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    message = obj.get("message", "")
                    turn_id = obj.get("turnId")

                    if not turn_id:
                        continue

                    match = model_pattern.search(message)

                    if match:

                        model = match.group(1)

                        models[turn_id] = model

                        model_count += 1

        except OSError:
            continue


print(f"Log files scanned       : {log_count}")
print(f"Model mappings found    : {len(models)}")


# ============================================================
# 2. READ KIRO usage_summary RECORDS
# ============================================================

print()
print("=" * 70)
print("STEP 2 - Reading Kiro session usage")
print("=" * 70)

results = []

session_files = 0
usage_records = 0

if not SESSIONS_DIR.exists():

    print("WARNING: Kiro sessions directory not found:")
    print(SESSIONS_DIR)

else:

    for messages_file in SESSIONS_DIR.rglob("messages.jsonl"):

        session_files += 1

        try:

            with messages_file.open(
                "r",
                encoding="utf-8",
                errors="ignore"
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

                    if not execution_id:
                        continue

                    # Match executionId with model
                    model = models.get(
                        execution_id,
                        "Unknown"
                    )

                    elapsed_ms = payload.get(
                        "elapsedTime"
                    )

                    summaries = payload.get(
                        "promptTurnSummaries",
                        []
                    )

                    for summary in summaries:

                        usage = summary.get("usage")

                        if usage is None:
                            continue

                        try:
                            credits = float(usage)
                        except (TypeError, ValueError):
                            continue

                        if elapsed_ms is not None:

                            try:
                                elapsed_seconds = round(
                                    float(elapsed_ms) / 1000,
                                    2
                                )
                            except (TypeError, ValueError):
                                elapsed_seconds = None

                        else:
                            elapsed_seconds = None


                        result = {

                            "timestamp":
                                obj.get("timestamp"),

                            "model":
                                model,

                            # Exact Kiro persisted value
                            "credits":
                                credits,

                            # UI-style rounded value
                            "estCredits":
                                round(credits, 2),

                            "unit":
                                summary.get("unit"),

                            "unitPlural":
                                summary.get("unitPlural"),

                            "elapsedTimeMs":
                                elapsed_ms,

                            "elapsedTimeSec":
                                elapsed_seconds,

                            "status":
                                payload.get("status"),

                            "executionId":
                                execution_id,

                            "requestIds":
                                payload.get(
                                    "requestIds",
                                    []
                                ),

                            "sessionFile":
                                str(messages_file),
                        }


                        if "usedTools" in summary:

                            result["usedTools"] = (
                                summary["usedTools"]
                            )


                        results.append(result)

                        usage_records += 1

        except OSError:
            continue


print(f"Session files scanned   : {session_files}")
print(f"Usage records found     : {usage_records}")


# ============================================================
# 3. REMOVE DUPLICATE EXECUTIONS
# ============================================================

print()
print("=" * 70)
print("STEP 3 - Removing duplicates")
print("=" * 70)

unique = {}

for item in results:

    execution_id = item["executionId"]

    unique[execution_id] = item

results = list(unique.values())

print(f"Unique executions       : {len(results)}")


# ============================================================
# 4. SORT CHRONOLOGICALLY
# ============================================================

results.sort(
    key=lambda x: x.get("timestamp") or ""
)


# ============================================================
# 5. CREATE REPORT
# ============================================================

report = {

    "generatedAt":
        datetime.now().astimezone().isoformat(),

    "totalExecutions":
        len(results),

    "executions":
        results
}


# ============================================================
# 6. SAVE JSON
# ============================================================

print()
print("=" * 70)
print("STEP 4 - Saving JSON")
print("=" * 70)

try:

    with JSON_FILE.open(
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            report,
            f,
            indent=2,
            ensure_ascii=False
        )

    print("JSON CREATED SUCCESSFULLY")
    print()
    print(f"Path   : {JSON_FILE}")
    print(f"Exists : {JSON_FILE.exists()}")
    print(f"Size   : {JSON_FILE.stat().st_size:,} bytes")

except Exception as e:

    print("ERROR WRITING JSON")
    print(repr(e))


# ============================================================
# 7. SAVE CSV
# ============================================================

print()
print("=" * 70)
print("STEP 5 - Saving CSV")
print("=" * 70)

try:

    if results:

        # Get every possible column
        fieldnames = set()

        for row in results:

            fieldnames.update(
                row.keys()
            )

        # Stable column order
        preferred_columns = [

            "timestamp",
            "model",
            "credits",
            "estCredits",
            "unit",
            "unitPlural",
            "elapsedTimeMs",
            "elapsedTimeSec",
            "status",
            "executionId",
            "requestIds",
            "usedTools",
            "sessionFile"
        ]

        fieldnames = [

            column
            for column in preferred_columns
            if column in fieldnames
        ]

        with CSV_FILE.open(
            "w",
            newline="",
            encoding="utf-8-sig"
        ) as f:

            writer = csv.DictWriter(
                f,
                fieldnames=fieldnames,
                extrasaction="ignore"
            )

            writer.writeheader()

            for row in results:

                # Convert lists to JSON strings
                csv_row = row.copy()

                if isinstance(
                    csv_row.get("requestIds"),
                    list
                ):

                    csv_row["requestIds"] = json.dumps(
                        csv_row["requestIds"],
                        ensure_ascii=False
                    )

                if isinstance(
                    csv_row.get("usedTools"),
                    list
                ):

                    csv_row["usedTools"] = json.dumps(
                        csv_row["usedTools"],
                        ensure_ascii=False
                    )

                writer.writerow(csv_row)


        print("CSV CREATED SUCCESSFULLY")
        print()
        print(f"Path   : {CSV_FILE}")
        print(f"Exists : {CSV_FILE.exists()}")
        print(f"Size   : {CSV_FILE.stat().st_size:,} bytes")


    else:

        print(
            "No execution records found."
        )

except Exception as e:

    print("ERROR WRITING CSV")
    print(repr(e))


# ============================================================
# 8. CONSOLE SUMMARY
# ============================================================

print()
print("=" * 70)
print("KIRO USAGE SUMMARY")
print("=" * 70)

print(
    f"Total executions : {len(results)}"
)

print(
    f"Model mappings   : {len(models)}"
)

print()
print(
    f"JSON             : {JSON_FILE}"
)

print(
    f"CSV              : {CSV_FILE}"
)

print()
print("=" * 70)
print("EXECUTIONS")
print("=" * 70)

for item in results:

    print(

        f"{item['timestamp']} | "

        f"{item['model']} | "

        f"{item['credits']:.12f} credit | "

        f"UI={item['estCredits']:.2f} | "

        f"{item['elapsedTimeSec']}s | "

        f"{item['status']} | "

        f"{item['executionId']}"

    )


print()
print("=" * 70)
print("DONE")
print("=" * 70)
```
