#!/usr/bin/env sh
# Start Math Mob (Linux/macOS). Requires the .NET 10 SDK: https://dotnet.microsoft.com/download
cd "$(dirname "$0")" && exec dotnet run --project MathMob.Web --launch-profile http
