import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse
from influxdb_client import InfluxDBClient

load_dotenv()

INFLUX_URL = os.getenv("INFLUX_URL", "http://localhost:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "kiro-local-token-2026")
INFLUX_ORG = os.getenv("INFLUX_ORG", "kiro")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "usage")

BILLING_LIMIT = float(
    os.getenv("BILLING_LIMIT", "50")
)

app = FastAPI(
    title="Kiro Usage Dashboard"
)


# ============================================================
# INFLUXDB
# ============================================================

def get_client():

    return InfluxDBClient(
        url=INFLUX_URL,
        token=INFLUX_TOKEN,
        org=INFLUX_ORG
    )


def query_influx(query):

    client = get_client()

    try:
        query_api = client.query_api()

        tables = query_api.query(
            query=query,
            org=INFLUX_ORG
        )

        return tables

    finally:
        client.close()


# ============================================================
# BILLING PERIOD
# ============================================================

def get_billing_period():

    now = datetime.now(timezone.utc)

    start = datetime(
        now.year,
        now.month,
        1,
        tzinfo=timezone.utc
    )

    if now.month == 12:

        reset = datetime(
            now.year + 1,
            1,
            1,
            tzinfo=timezone.utc
        )

    else:

        reset = datetime(
            now.year,
            now.month + 1,
            1,
            tzinfo=timezone.utc
        )

    return start, reset


# ============================================================
# EXECUTIONS
# ============================================================

def get_executions():

    start, reset = get_billing_period()

    start_text = start.isoformat()
    reset_text = reset.isoformat()

    query = f'''
from(bucket: "{INFLUX_BUCKET}")
    |> range(
        start: time(v: "{start_text}"),
        stop: time(v: "{reset_text}")
    )
    |> filter(fn: (r) =>
        r._measurement == "kiro_execution"
    )
    |> filter(fn: (r) =>
        r._field == "credits" or
        r._field == "elapsed_seconds"
    )
'''

    tables = query_influx(query)

    executions = {}

    for table in tables:

        for record in table.records:

            execution_id = record.values.get(
                "execution_id"
            )

            if not execution_id:
                continue

            if execution_id not in executions:

                executions[execution_id] = {
                    "execution_id": execution_id,
                    "timestamp": record.get_time().isoformat(),
                    "model": record.values.get(
                        "model",
                        "unknown"
                    ),
                    "status": record.values.get(
                        "status",
                        "unknown"
                    ),
                    "credits": 0,
                    "elapsed_seconds": None
                }

            field = record.get_field()
            value = record.get_value()

            if field == "credits":
                executions[
                    execution_id
                ]["credits"] = float(value)

            elif field == "elapsed_seconds":
                executions[
                    execution_id
                ]["elapsed_seconds"] = float(value)

    return list(executions.values())


# ============================================================
# API
# ============================================================

@app.get("/api/summary")
def summary():

    start, reset = get_billing_period()

    executions = get_executions()

    total = sum(
        e["credits"]
        for e in executions
    )

    remaining = max(
        BILLING_LIMIT - total,
        0
    )

    percentage = (
        total / BILLING_LIMIT * 100
        if BILLING_LIMIT
        else 0
    )

    durations = [
        e["elapsed_seconds"]
        for e in executions
        if e["elapsed_seconds"] is not None
    ]

    average_duration = (
        sum(durations) / len(durations)
        if durations
        else 0
    )

    by_model = {}

    for execution in executions:

        model = execution["model"]

        by_model[model] = (
            by_model.get(model, 0)
            + execution["credits"]
        )

    latest = sorted(
        executions,
        key=lambda x: x["timestamp"],
        reverse=True
    )[:20]

    return {
        "billing_period": {
            "start": start.date().isoformat(),
            "reset": reset.date().isoformat(),
            "limit": BILLING_LIMIT
        },

        "estimated_usage": {
            "credits": total,
            "remaining": remaining,
            "percentage": percentage,
            "executions": len(executions),
            "average_duration": average_duration
        },

        # Account usage intentionally remains separate.
        # We will populate this when we obtain the actual
        # GetUsageLimits result.
        "account_usage": None,

        "by_model": [
            {
                "model": model,
                "credits": credits
            }
            for model, credits in sorted(
                by_model.items(),
                key=lambda x: x[1],
                reverse=True
            )
        ],

        "latest": latest
    }


@app.get("/api/health")
def health():

    try:

        client = get_client()

        try:
            health = client.health()
        finally:
            client.close()

        return {
            "status": health.status,
            "message": health.message
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": str(exc)
        }


# ============================================================
# FRONTEND
# ============================================================

@app.get("/")
def index():

    return FileResponse(
        "index.html"
    )