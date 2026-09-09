from influxdb_client import InfluxDBClient
from datetime import datetime, timezone
import os

execution_id = "5645fd0c-5ec0-4edf-b303-a9a8c812d6d7"

client = InfluxDBClient(
    url=os.getenv("INFLUX_URL", "http://localhost:8086"),
    token=os.getenv("INFLUX_TOKEN", "kiro-local-token-2026"),
    org=os.getenv("INFLUX_ORG", "kiro"),
)

client.delete_api().delete(
    start=datetime(2026, 9, 4, 3, 57, 0, tzinfo=timezone.utc),
    stop=datetime(2026, 9, 4, 3, 58, 0, tzinfo=timezone.utc),
    predicate=f'execution_id="{execution_id}"',
    bucket=os.getenv("INFLUX_BUCKET", "usage"),
    org=os.getenv("INFLUX_ORG", "kiro"),
)

client.close()

print("Deleted old record:", execution_id)