@echo off
chcp 65001 >nul
title Aplicatie Gestiune
echo ============================================
echo    Aplicatie de Gestiune - Pornire
echo ============================================
echo.

cd /d "%~dp0"

echo Verificare dependente...
pip install -r requirements.txt --quiet 2>nul
if errorlevel 1 (
    echo.
    echo EROARE: Nu s-a putut instala dependentele.
    echo Asigurati-va ca Python este instalat.
    pause
    exit /b 1
)

echo.
echo Dependente instalate cu succes.
echo.
echo ============================================
echo    Aplicatia porneste...
echo    Deschide in browser: http://localhost:5000
echo    Login: admin / admin123
echo.
echo    Pentru oprire: inchide aceasta fereastra
echo ============================================
echo.

start "" http://localhost:5000

python app.py

pause
