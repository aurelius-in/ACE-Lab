$ErrorActionPreference = 'Stop'
Write-Host "-- health checks"
Invoke-RestMethod http://localhost:8101/health | ConvertTo-Json
Invoke-RestMethod http://localhost:8102/health | ConvertTo-Json
Invoke-RestMethod http://localhost:8103/health | ConvertTo-Json
Write-Host "-- tiny calls"
Invoke-RestMethod http://localhost:8101/animate -Method Post -ContentType 'application/json' -Body '{"prompt":"waves","seconds":2,"fps":12}' | ConvertTo-Json
Invoke-RestMethod http://localhost:8102/interpolate -Method Post -ContentType 'application/json' -Body '{"video_url":"data:video/webm;base64,","factor":2}' | ConvertTo-Json
Invoke-RestMethod http://localhost:8103/inpaint -Method Post -ContentType 'application/json' -Body '{"prompt":"fill","image_url":"data:image/png;base64,","mask_url":"data:image/png;base64,"}' | ConvertTo-Json


