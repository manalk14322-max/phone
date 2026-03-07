param([string]$Root='c:\Users\khan\Desktop\phone',[int]$Port=5502)
Add-Type -AssemblyName System.Web
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
$mime=@{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.json'='application/json; charset=utf-8';'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.svg'='image/svg+xml';'.webp'='image/webp';'.ico'='image/x-icon'}
while($listener.IsListening){
  try{
    $ctx=$listener.GetContext(); $req=$ctx.Request; $res=$ctx.Response
    $p=$req.Url.AbsolutePath; if([string]::IsNullOrWhiteSpace($p) -or $p -eq '/'){ $p='/index.html' }
    $rel=$p.TrimStart('/') -replace '/','\\'
    $full=Join-Path $Root $rel
    if((Test-Path $full) -and -not (Get-Item $full).PSIsContainer){
      $ext=[IO.Path]::GetExtension($full).ToLowerInvariant();
      if($mime.ContainsKey($ext)){ $res.ContentType=$mime[$ext] } else { $res.ContentType='application/octet-stream' }
      $bytes=[IO.File]::ReadAllBytes($full); $res.StatusCode=200; $res.ContentLength64=$bytes.Length; $res.OutputStream.Write($bytes,0,$bytes.Length)
    } else {
      $b=[Text.Encoding]::UTF8.GetBytes('404 Not Found'); $res.StatusCode=404; $res.ContentType='text/plain; charset=utf-8'; $res.ContentLength64=$b.Length; $res.OutputStream.Write($b,0,$b.Length)
    }
    $res.OutputStream.Close()
  }catch{}
}
