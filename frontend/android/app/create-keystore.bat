@echo off
REM Batch script to create release keystore
REM Run this script: create-keystore.bat

echo ========================================
echo Creating Release Keystore for MedHome
echo ========================================
echo.

set KEYSTORE_NAME=medhome-release.keystore
set ALIAS=medhome-key-alias

echo Keystore will be created as: %KEYSTORE_NAME%
echo Alias name: %ALIAS%
echo.
echo You will be prompted to enter:
echo - Keystore password (enter twice)
echo - Certificate information
echo.

keytool -genkeypair -v -storetype PKCS12 -keystore %KEYSTORE_NAME% -alias %ALIAS% -keyalg RSA -keysize 2048 -validity 10000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Keystore created successfully!
    echo ========================================
    echo.
    echo IMPORTANT: Save your keystore password securely!
    echo Keystore file: %KEYSTORE_NAME%
    echo Alias: %ALIAS%
    echo.
    echo Next step: Create keystore.properties file
) else (
    echo.
    echo ERROR: Failed to create keystore!
    exit /b 1
)

pause












