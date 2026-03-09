@echo off
chcp 65001 >nul
title AI装修助手 - 一键启动

cd /d "%~dp0"

echo ============================================================
echo   AI装修助手 · 启动中...
echo ============================================================

:: 后端 - 后台运行
start /min "后端-8000" cmd /c "cd /d %~dp0 && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 前端 - 后台运行
start /min "前端-3000" cmd /c "cd /d %~dp0 && npx vite --port 3000 --host 0.0.0.0"

:: 等前端起来再开浏览器
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo   后端: http://localhost:8000
echo   前端: http://localhost:3000
echo.
echo   已在后台运行，本窗口可关闭。
echo   停止服务请在任务管理器关闭 node.exe 和 uvicorn
echo ============================================================
