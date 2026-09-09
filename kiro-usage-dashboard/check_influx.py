from influxdb_client import InfluxDBClient
import os
from dotenv import load_dotenv

load_dotenv()

client = InfluxDBClient(
    url=os.getenv("INFLUX_URL", "http://localhost:8086"),
    token=os.getenv("INFLUX_TOKEN", "kiro-local-token-2026"),
    org=os.getenv("INFLUX_ORG", "kiro"),
)

bucket = os.getenv("INFLUX_BUCKET", "usage")

query = f'''
from(bucket: "{bucket}")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "kiro_execution")
  |> filter(fn: (r) => r.execution_id == "2db04464-73a5-4fdf-83f5-94aad7ea3b11")
'''

for table in client.query_api().query(query):
    for record in table.records:
        print("time:", record.get_time())
        print("field:", record.get_field())
        print("value:", record.get_value())
        print("model:", record.values.get("model"))
        print("status:", record.values.get("status"))
        print("---")

client.close()