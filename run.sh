#!/usr/bin/env sh
# Start Math Mob (Linux/macOS). Requires the .NET 10 SDK: https://dotnet.microsoft.com/download
cd "$(dirname "$0")" || exit 1

echo
echo "=============================================="
echo "  Math Mob is starting..."
echo "  When it says 'Now listening', open this in your browser:"
echo
echo "      http://localhost:5044"
echo
echo "  Press Ctrl+C to stop."
echo "=============================================="
echo

exec dotnet run --project MathMob.Web --launch-profile http
