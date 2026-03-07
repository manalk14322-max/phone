param(
  [string]$Root = 'c:\Users\khan\Desktop\phone',
  [int]$Port = 5500
)

$ErrorActionPreference = 'Stop'

$mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8';
  '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.txt'='text/plain; charset=utf-8';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif';
  '.svg'='image/svg+xml'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.avif'='image/avif';
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.ttf'='font/ttf'; '.eot'='application/vnd.ms-fontobject';
  '.map'='application/json'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

function Send-Response($stream, [int]$status, [string]$statusText, [string]$contentType, [byte[]]$body) {
  $header = "HTTP/1.1 $status $statusText`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($body, 0, $body.Length)
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()

    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      $client.Close(); continue
    }

    while ($true) {
      $line = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($line)) { break }
    }

    $parts = $requestLine.Split(' ')
    $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
    $pathOnly = $rawPath.Split('?')[0]
    $decodedPath = [System.Uri]::UnescapeDataString($pathOnly)
    if ($decodedPath -eq '/' -or [string]::IsNullOrWhiteSpace($decodedPath)) { $decodedPath = '/index.html' }

    $safeRel = $decodedPath.TrimStart('/') -replace '/', '\\'
    $fullPath = Join-Path $Root $safeRel

    if ((-not (Test-Path $fullPath)) -or (Get-Item $fullPath).PSIsContainer) {
      $body = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
      Send-Response $stream 404 'Not Found' 'text/plain; charset=utf-8' $body
      $client.Close(); continue
    }

    $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $body = [IO.File]::ReadAllBytes($fullPath)
    Send-Response $stream 200 'OK' $contentType $body
  }
  catch {
    try {
      $body = [Text.Encoding]::UTF8.GetBytes('500 Internal Server Error')
      Send-Response $stream 500 'Internal Server Error' 'text/plain; charset=utf-8' $body
    } catch {}
  }
  finally {
    $client.Close()
  }
}
