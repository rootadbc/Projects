#!/usr/bin/env python3
"""
RDP Exposure Audit
==================

Authorized-use tool for auditing RDP exposure:
- Tests TCP reachability for an RDP port (default: 3389)
- Accepts one target, a file of targets, or a CIDR range
- Uses bounded multithreading
- Optionally runs Nmap version detection for reachable hosts
- Writes findings as JSON and/or CSV

This tool does NOT attempt authentication or process credentials.
Use only on systems you own or are explicitly authorized to assess.
"""

from __future__ import annotations

import argparse
import csv
import ipaddress
import json
import shutil
import socket
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# Terminal colours. Output remains readable in terminals without ANSI support.
class Colour:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


PRINT_LOCK = threading.Lock()


def log(message: str, colour: str = Colour.WHITE) -> None:
    """Print a message without interleaving text from worker threads."""
    with PRINT_LOCK:
        print(f"{colour}{message}{Colour.RESET}", flush=True)


def load_targets_file(file_path: str) -> list[str]:
    """
    Load target entries from a text file.

    Empty lines and lines beginning with '#' are ignored.
    """
    path = Path(file_path)

    if not path.is_file():
        raise FileNotFoundError(f"Target file not found: {file_path}")

    targets: list[str] = []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if line and not line.startswith("#"):
                targets.append(line)

    return targets


def expand_cidr(cidr: str) -> list[str]:
    """
    Expand an IPv4 or IPv6 CIDR into host addresses.

    For safety, the caller enforces a maximum target count before scanning.
    """
    network = ipaddress.ip_network(cidr, strict=False)
    return [str(host) for host in network.hosts()]


def normalise_targets(entries: list[str], max_targets: int) -> list[str]:
    """
    Accept individual IPs/hostnames and CIDR entries, expand CIDRs,
    remove duplicates, and preserve input order.
    """
    seen: set[str] = set()
    targets: list[str] = []

    for entry in entries:
        try:
            candidates = expand_cidr(entry) if "/" in entry else [entry]
        except ValueError:
            # A hostname can contain unusual characters, but is still treated
            # as a single target. Invalid CIDR syntax is rejected.
            if "/" in entry:
                raise ValueError(f"Invalid CIDR notation: {entry}") from None
            candidates = [entry]

        for target in candidates:
            if target not in seen:
                seen.add(target)
                targets.append(target)

            if len(targets) > max_targets:
                raise ValueError(
                    f"Target limit exceeded ({max_targets}). "
                    "Use a smaller approved scope or increase --max-targets."
                )

    return targets


def tcp_probe(target: str, port: int, timeout: float) -> dict[str, Any]:
    """
    Attempt a TCP connection to target:port.

    A successful TCP connection means the port is reachable. It does not
    validate RDP configuration or attempt to authenticate.
    """
    started = time.monotonic()
    result: dict[str, Any] = {
        "target": target,
        "port": port,
        "reachable": False,
        "status": "unknown",
        "latency_ms": None,
        "error": None,
    }

    try:
        with socket.create_connection((target, port), timeout=timeout):
            elapsed_ms = round((time.monotonic() - started) * 1000, 2)
            result.update(
                {
                    "reachable": True,
                    "status": "open",
                    "latency_ms": elapsed_ms,
                }
            )
    except socket.timeout:
        result["status"] = "timeout"
        result["error"] = f"No connection within {timeout}s"
    except socket.gaierror as error:
        result["status"] = "resolution_error"
        result["error"] = str(error)
    except ConnectionRefusedError:
        result["status"] = "closed"
        result["error"] = "Connection refused"
    except OSError as error:
        result["status"] = "unreachable"
        result["error"] = str(error)

    return result


def nmap_service_check(target: str, port: int, timeout: int) -> dict[str, str | None]:
    """
    Run a focused Nmap service/version check on an already reachable endpoint.

    Nmap is optional. If unavailable or if the command fails, the findings
    still retain TCP-probe data and include the Nmap error.
    """
    if shutil.which("nmap") is None:
        return {
            "nmap_state": None,
            "nmap_service": None,
            "nmap_product": None,
            "nmap_version": None,
            "nmap_error": "nmap executable not found",
        }

    command = [
        "nmap",
        "-n",
        "-Pn",
        "-sV",
        "--version-light",
        "-p",
        str(port),
        "-oX",
        "-",
        target,
    ]

    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )

        # Lightweight parsing avoids a third-party XML dependency.
        output = completed.stdout
        state = "open" if f'portid="{port}" protocol="tcp"' in output else None

        return {
            "nmap_state": state,
            "nmap_service": "rdp" if "ms-wbt-server" in output else None,
            "nmap_product": "Microsoft Terminal Services"
            if "Microsoft Terminal Services" in output
            else None,
            "nmap_version": None,
            "nmap_error": None if completed.returncode == 0 else completed.stderr.strip(),
        }
    except subprocess.TimeoutExpired:
        return {
            "nmap_state": None,
            "nmap_service": None,
            "nmap_product": None,
            "nmap_version": None,
            "nmap_error": f"nmap timed out after {timeout}s",
        }
    except OSError as error:
        return {
            "nmap_state": None,
            "nmap_service": None,
            "nmap_product": None,
            "nmap_version": None,
            "nmap_error": str(error),
        }


def audit_one(
    target: str,
    port: int,
    timeout: float,
    use_nmap: bool,
    nmap_timeout: int,
) -> dict[str, Any]:
    """Perform a TCP RDP exposure check and optional Nmap enrichment."""
    finding = tcp_probe(target, port, timeout)
    finding["scanned_at"] = datetime.now(timezone.utc).isoformat()

    if use_nmap and finding["reachable"]:
        finding.update(nmap_service_check(target, port, nmap_timeout))

    return finding


def write_json(file_path: str, report: dict[str, Any]) -> None:
    """Write the complete report to JSON."""
    with Path(file_path).open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)


def write_csv(file_path: str, findings: list[dict[str, Any]]) -> None:
    """Write flattened findings to CSV."""
    fields = [
        "target",
        "port",
        "reachable",
        "status",
        "latency_ms",
        "error",
        "scanned_at",
        "nmap_state",
        "nmap_service",
        "nmap_product",
        "nmap_version",
        "nmap_error",
    ]

    with Path(file_path).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(findings)


def parse_arguments() -> argparse.Namespace:
    """Define and parse the command-line interface."""
    parser = argparse.ArgumentParser(
        description="Authorized RDP exposure audit tool; does not attempt authentication.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    targets_group = parser.add_mutually_exclusive_group(required=True)
    targets_group.add_argument("--target", help="One IP address or hostname")
    targets_group.add_argument("--targets", help="Text file with targets or CIDR entries")
    targets_group.add_argument("--cidr", help="One authorized CIDR range, such as 10.10.20.0/24")

    parser.add_argument("--port", type=int, default=3389, help="TCP port to check")
    parser.add_argument("--timeout", type=float, default=3.0, help="TCP connection timeout in seconds")
    parser.add_argument("--workers", type=int, default=10, help="Maximum concurrent scan workers")
    parser.add_argument(
        "--max-targets",
        type=int,
        default=4096,
        help="Maximum targets accepted after CIDR expansion",
    )
    parser.add_argument(
        "--nmap",
        action="store_true",
        help="Run optional Nmap service detection on reachable targets",
    )
    parser.add_argument(
        "--nmap-timeout",
        type=int,
        default=30,
        help="Maximum seconds for each optional Nmap invocation",
    )
    parser.add_argument("--output", help="Write full report as JSON")
    parser.add_argument("--csv", help="Write findings as CSV")
    parser.add_argument("--quiet", action="store_true", help="Show only final summary")

    args = parser.parse_args()

    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    if args.timeout <= 0:
        parser.error("--timeout must be greater than zero")
    if args.workers < 1:
        parser.error("--workers must be at least 1")
    if args.max_targets < 1:
        parser.error("--max-targets must be at least 1")

    return args


def main() -> int:
    """Run the RDP exposure audit."""
    args = parse_arguments()

    try:
        if args.target:
            entries = [args.target]
        elif args.cidr:
            entries = [args.cidr]
        else:
            entries = load_targets_file(args.targets)

        targets = normalise_targets(entries, args.max_targets)
    except (FileNotFoundError, ValueError) as error:
        log(f"[!] {error}", Colour.RED)
        return 2

    if not targets:
        log("[!] No valid targets were loaded.", Colour.RED)
        return 2

    if not args.quiet:
        log("=" * 66, Colour.CYAN)
        log("RDP Exposure Audit — authorized scope only", Colour.BOLD)
        log("=" * 66, Colour.CYAN)
        log(
            f"[*] Targets: {len(targets)} | Port: {args.port} | "
            f"Workers: {args.workers} | Timeout: {args.timeout}s",
            Colour.CYAN,
        )

    started = time.monotonic()
    findings: list[dict[str, Any]] = []

    # Bounded thread pool: at most --workers simultaneous TCP probes.
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_map = {
            executor.submit(
                audit_one,
                target,
                args.port,
                args.timeout,
                args.nmap,
                args.nmap_timeout,
            ): target
            for target in targets
        }

        for future in as_completed(future_map):
            target = future_map[future]

            try:
                finding = future.result()
                findings.append(finding)

                if not args.quiet:
                    if finding["reachable"]:
                        log(
                            f"[OPEN] {target}:{args.port} "
                            f"({finding['latency_ms']} ms)",
                            Colour.GREEN,
                        )
                    else:
                        log(
                            f"[{finding['status'].upper()}] {target}:{args.port}",
                            Colour.YELLOW,
                        )
            except Exception as error:
                findings.append(
                    {
                        "target": target,
                        "port": args.port,
                        "reachable": False,
                        "status": "worker_error",
                        "latency_ms": None,
                        "error": str(error),
                        "scanned_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                log(f"[ERROR] {target}: {error}", Colour.RED)

    findings.sort(key=lambda item: item["target"])
    elapsed = round(time.monotonic() - started, 2)
    reachable = sum(1 for item in findings if item["reachable"])

    report = {
        "tool": "RDP Exposure Audit",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "configuration": {
            "port": args.port,
            "timeout_seconds": args.timeout,
            "workers": args.workers,
            "nmap_enabled": args.nmap,
        },
        "summary": {
            "targets_scanned": len(findings),
            "reachable_rdp_ports": reachable,
            "elapsed_seconds": elapsed,
        },
        "findings": findings,
    }

    try:
        if args.output:
            write_json(args.output, report)
            log(f"[+] JSON report written: {args.output}", Colour.GREEN)

        if args.csv:
            write_csv(args.csv, findings)
            log(f"[+] CSV report written: {args.csv}", Colour.GREEN)
    except OSError as error:
        log(f"[!] Could not write output: {error}", Colour.RED)
        return 1

    log("=" * 66, Colour.CYAN)
    log(
        f"Complete: {len(findings)} scanned | {reachable} reachable | {elapsed}s",
        Colour.GREEN if reachable else Colour.YELLOW,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        log("\n[!] Interrupted by user.", Colour.YELLOW)
        raise SystemExit(130)