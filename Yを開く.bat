@echo off
setlocal
set "DIR=%~dp0"
set "URL=file:///%DIR:\=/%index.html"

where msedge >nul 2>nul
if %errorlevel%==0 (
  start "" msedge --app="%URL%" --window-size=1280,900
) else (
  start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="%URL%" --window-size=1280,900
)
endlocal
