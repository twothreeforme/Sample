@echo off
rem Start Math Mob (Windows). Requires the .NET 10 SDK: https://dotnet.microsoft.com/download
cd /d "%~dp0"

echo.
echo ==============================================
echo   Math Mob is starting...
echo   When it says "Now listening", open this in your browser:
echo.
echo       http://localhost:5044
echo.
echo   Press Ctrl+C to stop.
echo ==============================================
echo.

dotnet run --project MathMob.Web --launch-profile http
