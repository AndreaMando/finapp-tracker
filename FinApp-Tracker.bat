@echo off
REM change to script directory (handles being run from elsewhere)
cd /d "%~dp0"

REM build the production output and then launch the server
npm run build && npm run start