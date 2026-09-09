#!/usr/bin/env python3

import sys
import json
import re
from pathlib import Path

# ============================================================
# Security Rules
# ============================================================

RULES = [
    {
        "id": "hardcoded-api-key",
        "severity": "error",  # SARIF levels: error, warning, note
        "pattern": re.compile(
            r"""(?i)(api[_-]?key|access[_-]?key|api[_-]?token)\s*[:=]\s*["'][^"']{8,}["']""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded API key or access token",
    },
    {
        "id": "aws-access-key",
        "severity": "error",
        "pattern": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "message": "Possible AWS access key detected",
    },
    {
        "id": "private-key",
        "severity": "error",
        "pattern": re.compile(r"-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----"),
        "message": "Private cryptographic key detected",
    },
    {
        "id": "certificate",
        "severity": "warning",
        "pattern": re.compile(r"-----BEGIN (?:CERTIFICATE|X509 CERTIFICATE)-----"),
        "message": "Certificate detected in source code",
    },
    {
        "id": "encryption-key",
        "severity": "error",
        "pattern": re.compile(
            r"""(?i)(encryption[_-]?key|encrypt[_-]?key|signing[_-]?key|private[_-]?key|secret[_-]?key)\s*[:=]\s*["'][^"']{8,}["']""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded encryption or signing key",
    },
    {
        "id": "auth-token",
        "severity": "warning",
        "pattern": re.compile(
            r"""(?i)(authorization|bearer|auth[_-]?token|access[_-]?token|refresh[_-]?token|id[_-]?token|session[_-]?id|session[_-]?token)\s*[:=]\s*["'][^"']{8,}["']""",
            re.VERBOSE,
        ),
        "message": "Possible authentication or session token",
    },
    {
        "id": "jwt-token",
        "severity": "warning",
        "pattern": re.compile(r"\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b"),
        "message": "Possible JWT token detected",
    },
    {
        "id": "hardcoded-password",
        "severity": "error",
        "pattern": re.compile(
            r"""(?i)(password|passwd|pwd)\s*[:=]\s*["'][^"']{3,}["']""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded password",
    },
    {
        "id": "hardcoded-secret",
        "severity": "error",
        "pattern": re.compile(
            r"""(?i)(secret|client_secret|app_secret)\s*[:=]\s*["'][^"']{6,}["']""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded secret",
    },
    {
        "id": "internal-ip",
        "severity": "warning",
        "pattern": re.compile(r"\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3}\.)\d{1,3})\b"),
        "message": "Internal/private IP address detected",
    },
    {
        "id": "hardcoded-ip",
        "severity": "note",
        "pattern": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
        "message": "Hardcoded IPv4 address detected",
    },
    {
        "id": "internal-url",
        "severity": "warning",
        "pattern": re.compile(
            r"""(?i)https?://(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?(?:/[^\s"'<>]*)?""",
            re.VERBOSE,
        ),
        "message": "Hardcoded internal URL detected",
    },
    {
        "id": "internal-domain",
        "severity": "warning",
        "pattern": re.compile(
            r"""(?i)https?://[A-Za-z0-9._-]+\.(?:internal|local|corp|private)(?:[/:?#][^\s"'<>]*)?""",
            re.VERBOSE,
        ),
        "message": "Possible internal domain detected",
    },
    {
        "id": "database-credentials",
        "severity": "error",
        "pattern": re.compile(
            r"""(?i)(?:mongodb|mongodb\+srv|mysql|postgres|postgresql|mssql|oracle|redis)://[^/\s:@]+:[^@\s]+@""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded database credentials",
    },
    {
        "id": "database-password",
        "severity": "error",
        "pattern": re.compile(
            r"""(?i)(db[_-]?(?:password|pass)|database[_-]?(?:password|pass))\s*[:=]\s*["'][^"']+["']""",
            re.VERBOSE,
        ),
        "message": "Possible hardcoded database password",
    },
]

TEXT_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".c", ".cpp", 
    ".h", ".hpp", ".cs", ".php", ".rb", ".swift", ".kt", ".kts", ".json", 
    ".yaml", ".yml", ".xml", ".properties", ".ini", ".conf", ".env", ".txt", 
    ".sql", ".sh", ".ps1"
}

def should_scan(file_path: Path) -> bool:
    if file_path.name.startswith(".env"):
        return True
    return file_path.suffix.lower() in TEXT_EXTENSIONS

def scan_file(file_path: Path):
    findings = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return None, f"Unable to read file: {exc}"

    lines = content.splitlines()
    for line_number, line in enumerate(lines, start=1):
        for rule in RULES:
            if rule["pattern"].search(line):
                findings.append({
                    "rule": rule["id"],
                    "severity": rule["severity"],
                    "line": line_number,
                    "message": rule["message"],
                })
    return findings, None

# ============================================================
# Multi-Tool Format Converters
# ============================================================

def generate_sarif(file_path: Path, findings: list) -> dict:
    """Generates industry-standard SARIF JSON for GitHub & VS Code."""
    results = []
    for f in findings:
        results.append({
            "ruleId": f["rule"],
            "message": {"text": f["message"]},
            "level": f["severity"],
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": file_path.as_posix()},
                    "region": {
                        "startLine": f["line"],
                        "startColumn": 1
                    }
                }
            }]
        })
        
    return {
        "$schema": "https://azurewebsites.net",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "Custom-Security-Scanner",
                    "version": "1.0.0",
                    "rules": [{"id": r["id"], "shortDescription": {"text": r["message"]}} for r in RULES]
                }
            },
            "results": results
        }]
    }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"status": "error", "message": "Usage: security_scan.py <file>"}))
        return 2

    file_path = Path(sys.argv[1])
    if not file_path.exists() or not file_path.is_file():
        print(json.dumps({"status": "error", "message": "File invalid or missing"}))
        return 2

    findings = []
    if should_scan(file_path):
        scanned_findings, error = scan_file(file_path)
        if error:
            print(json.dumps({"status": "error", "message": error}))
            return 2
        findings = scanned_findings if scanned_findings else []

    # Check if run environment prefers standard SARIF reporting over raw Kiro JSON
    # Passing --sarif flags or checking CI system variables forces standard outputs
    if "--sarif" in sys.argv or "GITHUB_ACTIONS" in sys.environ:
        print(json.dumps(generate_sarif(file_path, findings), indent=2))
        return 0

    # Default output matches both Kiro parsing expectations and standard JSON parsers
    output = {
        "status": "vulnerable" if len(findings) > 0 else "secure",
        "file": file_path.name,
        "finding_count": len(findings),
        "findings": findings
    }
    print(json.dumps(output, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())