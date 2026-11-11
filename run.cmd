@echo off
rem Start Math Mob (Windows). Requires the .NET 10 SDK: https://dotnet.microsoft.com/download
cd /d "%~dp0"
dotnet run --project MathMob.Web --launch-profile http
