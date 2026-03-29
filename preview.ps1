Start-Process -FilePath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "& '$PSScriptRoot\start-local-server.ps1' -Root '$PSScriptRoot' -Port 5508"
) -PassThru

$deadline = (Get-Date).AddSeconds(15)
do {
  Start-Sleep -Milliseconds 300
  try {
    if ((Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5508/').StatusCode -eq 200) {
      break
    }
  } catch {
    # Keep waiting until the preview server is ready or the timeout expires.
  }
} while ((Get-Date) -lt $deadline)

Start-Process 'http://127.0.0.1:5508/iphone.html?cat=SIM'
