@echo off
title Cloudflare Tunnel - VLM Service (Port 8000)
cd /d "%~dp0"

echo ====================================================================
echo  Starting Cloudflare HTTPS Tunnel for Python VLM Backend (Port 8000)
echo ====================================================================

cloudflared.exe tunnel --edge-ip-version 4 --protocol http2 --url http://localhost:8000

pause
