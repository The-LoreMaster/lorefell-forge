@echo off
cd /d "%~dp0"
python recap_cutter.py
if errorlevel 1 pause
