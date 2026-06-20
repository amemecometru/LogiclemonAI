#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
python3 inline_assets.py
# Requires CF_API_TOKEN in environment (set via .env or export)
python3 deploy_dipdesigns.py
