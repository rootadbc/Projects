# RDP Exposure Audit

Simple Python tool for identifying reachable RDP services in an authorized environment.

## Features

- Scan a single host, target file, or approved CIDR range
- Check TCP/3389 reachability
- Configurable timeout and worker count
- Optional Nmap service detection
- Export JSON and CSV findings

## Requirements

```bash
sudo apt update
sudo apt install -y python3 python3-venv nmap
```

## Quick Start

```bash
git clone https://github.com/rootadbc/Projects/tree/main/Cybersecurity/Red-Team/rdp-audit
cd rdp-audit

python3 rdp_audit.py --target 192.168.1.10
```

### Scan targets from a file

```bash
python3 rdp_audit.py \
  --targets targets.txt \
  --workers 5 \
  --timeout 3 \
  --output findings.json
```

### Scan an approved CIDR range

```bash
python3 rdp_audit.py \
  --cidr 10.10.20.0/24 \
  --workers 10 \
  --timeout 3 \
  --nmap \
  --output findings.json
```

## VPS Usage

Use only from an approved, allow-listed VPS.

```bash
sudo apt install -y python3 nmap tmux
tmux new -s rdp-audit

python3 rdp_audit.py \
  --targets approved-targets.txt \
  --workers 5 \
  --timeout 3 \
  --output findings.json \
  2>&1 | tee audit.log
```

Detach with `Ctrl-b d`; reconnect with:

```bash
tmux attach -t rdp-audit
```

## Authorized Use

Use only on systems you own or have written permission to assess. Do not use this tool for unauthorized scanning, credential testing, or password spraying.
