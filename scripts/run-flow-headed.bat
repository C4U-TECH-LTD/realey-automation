@echo off
title Realey Automation - Flow 1 Headed Test
cd /d "D:\realey-automation"
echo ========================================================
echo Starting Flow 1 in Headed Google Chrome...
echo ========================================================
set HEADLESS=false
set SLOW_MO=500
call npx cucumber-js --tags "@fixed-price"
echo ========================================================
echo Test run finished.
echo ========================================================
pause
