@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title DreamSpirit Preview Launcher

set "HAS_DOCKER=0"
set "NPM_CMD="
set "BROWSER_EXE="

where docker >nul 2>nul
if %errorlevel%==0 set "HAS_DOCKER=1"

set "DOCKER_DESKTOP_EXE="
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
  set "DOCKER_DESKTOP_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
)
if not defined DOCKER_DESKTOP_EXE (
  if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_EXE=%LocalAppData%\Docker\Docker Desktop.exe"
  )
)

if exist "%ProgramFiles%\nodejs\npm.cmd" (
  set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
)

if not defined NPM_CMD (
  if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
  )
)

if not defined NPM_CMD (
  for /f "delims=" %%N in ('where npm.cmd 2^>nul') do (
    if not defined NPM_CMD set "NPM_CMD=%%N"
  )
)

if not defined NPM_CMD (
  for /f "delims=" %%N in ('where npm 2^>nul') do (
    if not defined NPM_CMD set "NPM_CMD=%%N"
  )
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
)

if not defined BROWSER_EXE (
  if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  )
)

if not defined BROWSER_EXE (
  if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  )
)

if not defined BROWSER_EXE (
  if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
  )
)

echo.
echo DreamSpirit one-click preview launcher
echo.

if not defined NPM_CMD (
  echo npm was not found.
  echo Please install Node.js from https://nodejs.org/ and run this launcher again.
  echo.
  pause
  exit /b 1
)

if "%1"=="--worker-only" (
  call "!NPM_CMD!" run worker
  if errorlevel 1 pause
  exit /b %errorlevel%
)

if "%1"=="--web-only" (
  if "%2"=="lan" (
    call "!NPM_CMD!" run start -- -H 0.0.0.0
  ) else (
    call "!NPM_CMD!" run start -- -H 127.0.0.1
  )
  if errorlevel 1 pause
  exit /b %errorlevel%
)

set "NETWORK_MODE=local"
echo Choose preview mode:
echo   [1] Local only / offline-friendly - only this computer opens DreamSpirit
echo   [2] LAN or tunnel - other devices can connect to this computer
choice /C 12 /N /M "Select 1 or 2: "
if errorlevel 2 set "NETWORK_MODE=lan"
echo.

set "STARTUP_MODE=quick"
echo Choose startup type:
echo   [1] Quick start - use existing database and build
echo   [2] Initialize / repair - sync database, seed starter data, rebuild
choice /C 12 /N /M "Select 1 or 2: "
if errorlevel 2 set "STARTUP_MODE=repair"
echo.

set "LAN_HOST="
for /f "delims=" %%I in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetIPConfiguration ^| Where-Object IPv4DefaultGateway ^| Select-Object -First 1).IPv4Address.IPAddress"') do (
  if not defined LAN_HOST set "LAN_HOST=%%I"
)

echo [0/4] Stopping old DreamSpirit Node processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd = (Resolve-Path '.').Path; Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($cwd) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
if errorlevel 1 goto fail

if not exist ".env.local" (
  echo [1/4] Creating .env.local from .env.example...
  copy /Y ".env.example" ".env.local" >nul
) else (
  echo [1/4] .env.local already exists.
)

echo Preparing local environment for Prisma...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath '.env.local' | Set-Content -LiteralPath '.env' -Encoding ascii"
if errorlevel 1 goto fail

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath 'node_modules\.prisma\client' -Filter 'query_engine-windows.dll.node.tmp*' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue"

if not exist "node_modules" (
  if "!STARTUP_MODE!"=="quick" (
    echo Dependencies are missing. Switching to initialize / repair mode.
    set "STARTUP_MODE=repair"
  )
) else (
  echo [2/4] Dependencies already installed.
)

if not exist ".next\BUILD_ID" (
  if "!STARTUP_MODE!"=="quick" (
    echo Stable build is missing. Switching to initialize / repair mode.
    set "STARTUP_MODE=repair"
  )
)

if "!STARTUP_MODE!"=="repair" (
  if not exist "node_modules" (
    echo [2/8] Installing dependencies...
    call "!NPM_CMD!" install
    if errorlevel 1 goto fail
  ) else (
    echo [2/8] Dependencies already installed.
  )
) else (
  echo [2/4] Quick start selected. Skipping dependency install, Prisma sync, seed, and rebuild.
)

if "!HAS_DOCKER!"=="1" (
  if "!STARTUP_MODE!"=="repair" (
    echo [3/8] Checking Docker Desktop...
  ) else (
    echo [3/4] Checking Docker Desktop...
  )
  docker info >nul 2>nul
  if errorlevel 1 (
    if defined DOCKER_DESKTOP_EXE (
      echo Docker is installed but not running. Starting Docker Desktop...
      start "" "!DOCKER_DESKTOP_EXE!"
      powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i = 0; $i -lt 90; $i++) { docker info *> $null; if ($LASTEXITCODE -eq 0) { $ready = $true; break }; Start-Sleep -Seconds 1 }; if (-not $ready) { exit 1 }"
      if errorlevel 1 goto docker_fail
    ) else (
      goto docker_fail
    )
  )
  if "!STARTUP_MODE!"=="repair" (
    echo [3/8] Starting PostgreSQL with Docker...
  ) else (
    echo [3/4] Starting PostgreSQL with Docker...
  )
  call docker compose up -d
  if errorlevel 1 goto docker_fail
) else (
  if "!STARTUP_MODE!"=="repair" (
    echo [3/8] Docker not found. Skipping container startup...
  ) else (
    echo [3/4] Docker not found. Skipping container startup...
  )
  echo The launcher will try to use the DATABASE_URL already configured in .env.local.
)

if "!STARTUP_MODE!"=="repair" (
  echo [4/8] Generating Prisma client...
  call "!NPM_CMD!" run prisma:generate
  if errorlevel 1 goto fail

  echo [5/8] Syncing database schema...
  call "!NPM_CMD!" run prisma:push
  if errorlevel 1 goto db_fail

  echo [6/8] Seeding starter account...
  call "!NPM_CMD!" run prisma:seed
  if errorlevel 1 goto db_fail

  echo [7/8] Building stable preview...
  call "!NPM_CMD!" run build
  if errorlevel 1 goto fail
)

if "!STARTUP_MODE!"=="repair" (
  echo [8/8] Starting web app and worker...
) else (
  echo [4/4] Starting web app and worker...
)
start "DreamSpirit Worker" /D "%~dp0" cmd /k call start-preview.bat --worker-only
start "DreamSpirit Web" /D "%~dp0" cmd /k call start-preview.bat --web-only !NETWORK_MODE!

echo.
echo Waiting for the web app to boot...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/sign-in' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { $ready = $true; break } } catch {}; Start-Sleep -Seconds 1 }; if (-not $ready) { exit 1 }"
if errorlevel 1 goto web_fail

set "LOCAL_URL=http://127.0.0.1:3000/start"
set "LAN_URL="
if defined LAN_HOST set "LAN_URL=http://!LAN_HOST!:3000/start"

echo.
echo Opening browser...
if defined BROWSER_EXE (
  echo Browser: !BROWSER_EXE!
  start "" "!BROWSER_EXE!" "!LOCAL_URL!"
) else (
  echo Browser: Windows default app
  start "" "!LOCAL_URL!"
)
if errorlevel 1 start "" "!LOCAL_URL!"
if errorlevel 1 rundll32 url.dll,FileProtocolHandler "!LOCAL_URL!"

echo.
echo DreamSpirit is opening in your browser.
echo Starter account: dreamer@dreamspirit.local / dreamspirit123
if "!STARTUP_MODE!"=="repair" (
  echo Startup type: Initialize / repair
) else (
  echo Startup type: Quick start
)
echo Local URL: !LOCAL_URL!
if "!NETWORK_MODE!"=="lan" (
  if defined LAN_HOST (
    echo LAN URL:   !LAN_URL!
    echo Other devices on the same Wi-Fi can try the LAN URL if Windows Firewall allows port 3000.
  ) else (
    echo LAN URL could not be detected automatically.
  )
  echo For temporary internet access, expose http://127.0.0.1:3000 with a temporary tunnel tool.
) else (
  echo Mode: Local only. Other devices should not be able to connect unless you restart in LAN or tunnel mode.
)
echo AI features can be configured in Settings after login.
echo.
pause
exit /b 0

:web_fail
echo.
echo Preview startup stopped because the web app did not become reachable on http://127.0.0.1:3000.
echo Check the "DreamSpirit Web" window for the Next.js error message.
echo.
pause
exit /b 1

:db_fail
echo.
echo Preview startup stopped because DreamSpirit could not connect to PostgreSQL.
echo Current DATABASE_URL is read from .env.local.
echo.
if "!HAS_DOCKER!"=="0" (
  echo Fix options:
  echo 1. Install Docker Desktop, then run this launcher again.
  echo 2. Or install/start a local PostgreSQL service on localhost:5432.
  echo 3. Or edit .env.local so DATABASE_URL points to an existing PostgreSQL database.
) else (
  echo Fix options:
  echo 1. Make sure Docker Desktop is actually running.
  echo 2. Or edit .env.local so DATABASE_URL points to an existing PostgreSQL database.
)
echo.
pause
exit /b 1

:docker_fail
echo.
echo Preview startup stopped because Docker Desktop is not running or PostgreSQL could not start.
echo.
echo Fix options:
echo 1. Open Docker Desktop, wait until it says Docker is running, then run this launcher again.
echo 2. Or install/start a local PostgreSQL service on localhost:5432.
echo 3. Or edit .env.local so DATABASE_URL points to an existing PostgreSQL database.
echo.
pause
exit /b 1

:fail
echo.
echo Preview startup failed.
echo Please check the command output above and try again.
echo If AI features are needed, also check .env.local.
echo.
pause
exit /b 1
