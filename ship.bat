@echo off
setlocal EnableDelayedExpansion
REM ============================================
REM  ship.bat — One-command commit + push
REM  Usage:  ship "your commit message"
REM  If no message provided, uses a timestamp.
REM ============================================

cd /d "%~dp0"

REM --- Capture message with delayed expansion to handle parens/colons ---
set "MSG=%~1"
if "!MSG!"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "D=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "T=%%a%%b"
    set "MSG=update !D! !T!"
)

echo.
echo  [ship] Staging all changes...
git add .

echo  [ship] Running type check...
call npx tsc --noEmit 2>nul
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ship] TYPE ERRORS DETECTED — fix before shipping.
    echo  [ship] Run 'npx tsc --noEmit' to see details.
    echo.
    exit /b 1
)

echo  [ship] Committing: !MSG!
git commit -m "!MSG!"

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ship] Nothing to commit — working tree clean.
    echo.
    exit /b 0
)

echo  [ship] Pushing to origin/master...
git push origin master

if !ERRORLEVEL! EQU 0 (
    echo.
    echo  [ship] Done. Shipped to origin/master.
) else (
    echo.
    echo  [ship] Push failed. Run 'git pull --rebase origin master' first.
)

endlocal
