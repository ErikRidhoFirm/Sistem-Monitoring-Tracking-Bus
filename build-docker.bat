@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "IMAGE_NAME=%~1"
if "%IMAGE_NAME%"=="" set "IMAGE_NAME=bagusok/buswy:latest"

set "ENV_FILE=%~2"
if "%ENV_FILE%"=="" set "ENV_FILE=.env.production"

if not exist "%ENV_FILE%" (
  echo Env file not found: %ENV_FILE%
  exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  set "ENV_KEY=%%A"
  set "ENV_VALUE=%%~B"
  if not "!ENV_KEY!"=="" set "!ENV_KEY!=!ENV_VALUE!"
)

if "%NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN%"=="" (
  echo Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in %ENV_FILE%
  exit /b 1
)

echo Building Docker image: %IMAGE_NAME%
docker build ^
  --build-arg NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="%NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN%" ^
  --build-arg NEXT_PUBLIC_BUS_FEED_MODE="%NEXT_PUBLIC_BUS_FEED_MODE%" ^
  --build-arg NEXT_PUBLIC_MQTT_BROKER_URL="%NEXT_PUBLIC_MQTT_BROKER_URL%" ^
  --build-arg NEXT_PUBLIC_MQTT_TOPIC="%NEXT_PUBLIC_MQTT_TOPIC%" ^
  --build-arg NEXT_PUBLIC_MQTT_USERNAME="%NEXT_PUBLIC_MQTT_USERNAME%" ^
  --build-arg NEXT_PUBLIC_MQTT_PASSWORD="%NEXT_PUBLIC_MQTT_PASSWORD%" ^
  -t "%IMAGE_NAME%" .

if errorlevel 1 exit /b 1

echo Pushing Docker image: %IMAGE_NAME%
docker push "%IMAGE_NAME%"

if errorlevel 1 exit /b 1

echo Docker image built and pushed: %IMAGE_NAME%
