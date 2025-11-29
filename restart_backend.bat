@echo off
echo ========================================
echo  Reiniciando Backend Sigma
echo ========================================
echo.

REM Mudar para o diretório do backend
cd /d "%~dp0backend"

echo [1/3] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo.
echo [2/3] Parando processos uvicorn existentes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Iniciando servidor backend...
echo Backend rodando em: http://localhost:8000
echo Pressione Ctrl+C para parar
echo.

uvicorn main:app --reload

pause
