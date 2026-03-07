$ErrorActionPreference = 'Stop'

$rootDir = (Get-Location).Path
$indexPath = Join-Path $rootDir 'index.html'
$assetRoot = Join-Path $rootDir 'assets\ellietech.com'
New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null

Add-Type -AssemblyName System.Net.Http
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
$handler.SslProtocols = [System.Security.Authentication.SslProtocols]::Tls12
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(45)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36')

$downloaded = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$urlToLocal = @{}
$failed = [System.Collections.Generic.List[string]]::new()
$cssQueue = [System.Collections.Generic.Queue[string]]::new()

function Get-FilePathFromUrl([string]$url) {
    $uri = [Uri]$url
    $path = $uri.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    if ($path.EndsWith('/')) { $path += 'index.html' }

    if ($uri.Query) {
        $ext = [IO.Path]::GetExtension($path)
        $dir = [IO.Path]::GetDirectoryName($path)
        $name = [IO.Path]::GetFileNameWithoutExtension($path)
        $qBytes = [Text.Encoding]::UTF8.GetBytes($uri.Query)
        $qHex = [Convert]::ToHexString($qBytes).ToLower()
        if ([string]::IsNullOrEmpty($ext)) {
            $path = if ([string]::IsNullOrEmpty($dir)) { "$name.q$qHex" } else { (Join-Path $dir "$name.q$qHex") }
        } else {
            $path = if ([string]::IsNullOrEmpty($dir)) { "$name.q$qHex$ext" } else { (Join-Path $dir "$name.q$qHex$ext") }
        }
    }

    return (Join-Path $assetRoot $path)
}

function To-LocalRelative([string]$fullPath) {
    $baseUri = [Uri]((Resolve-Path $rootDir).Path + [IO.Path]::DirectorySeparatorChar)
    $toUri = [Uri]((Resolve-Path $fullPath).Path)
    return ($baseUri.MakeRelativeUri($toUri).ToString())
}

function Download-Url([string]$url) {
    if ($downloaded.Contains($url)) { return $true }
    if (-not $url.StartsWith('https://www.ellietech.com/')) { return $false }

    try {
        $localPath = Get-FilePathFromUrl $url
        $localDir = Split-Path -Parent $localPath
        if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Force -Path $localDir | Out-Null }

        $bytes = $client.GetByteArrayAsync($url).GetAwaiter().GetResult()
        [IO.File]::WriteAllBytes($localPath, $bytes)

        $downloaded.Add($url) | Out-Null
        $urlToLocal[$url] = $localPath

        if ($url -match '\.css(\?|$)') {
            $cssQueue.Enqueue($url)
        }

        return $true
    }
    catch {
        $failed.Add($url) | Out-Null
        return $false
    }
}

function Extract-UrlsFromHtml([string]$html) {
    $urls = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    $attrPattern = '(?:href|src|poster|data-src)=["''](https://www\.ellietech\.com[^"'']+)["'']'
    foreach ($m in [regex]::Matches($html, $attrPattern)) { $urls.Add($m.Groups[1].Value) | Out-Null }

    $srcSetPattern = '(?:srcset|data-srcset)=["'']([^"'']+)["'']'
    foreach ($m in [regex]::Matches($html, $srcSetPattern)) {
        $parts = $m.Groups[1].Value -split ','
        foreach ($p in $parts) {
            $candidate = ($p.Trim() -split '\s+')[0]
            if ($candidate -like 'https://www.ellietech.com/*') { $urls.Add($candidate) | Out-Null }
        }
    }

    return $urls
}

function Resolve-CssUrl([Uri]$baseUri, [string]$raw) {
    $u = $raw.Trim().Trim('"','''')
    if ([string]::IsNullOrWhiteSpace($u)) { return $null }
    if ($u.StartsWith('data:')) { return $null }
    if ($u.StartsWith('https://www.ellietech.com/')) { return $u }
    if ($u.StartsWith('//www.ellietech.com/')) { return ('https:' + $u) }
    if ($u.StartsWith('/')) { return ('https://www.ellietech.com' + $u) }
    if ($u.StartsWith('http://') -or $u.StartsWith('https://')) { return $null }

    $resolved = [Uri]::new($baseUri, $u)
    if ($resolved.Host -ieq 'www.ellietech.com') { return $resolved.AbsoluteUri }
    return $null
}

$html = Get-Content -Raw $indexPath
$seedUrls = Extract-UrlsFromHtml $html

foreach ($url in $seedUrls) {
    [void](Download-Url $url)
}

while ($cssQueue.Count -gt 0) {
    $cssUrl = $cssQueue.Dequeue()
    if (-not $urlToLocal.ContainsKey($cssUrl)) { continue }

    $cssPath = $urlToLocal[$cssUrl]
    if (-not (Test-Path $cssPath)) { continue }

    $cssText = Get-Content -Raw $cssPath
    $baseUri = [Uri]$cssUrl

    $refs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($m in [regex]::Matches($cssText, 'url\(([^)]+)\)')) {
        $resolved = Resolve-CssUrl $baseUri $m.Groups[1].Value
        if ($resolved) { $refs.Add($resolved) | Out-Null }
    }

    foreach ($m in [regex]::Matches($cssText, '@import\s+(?:url\()?[''"'']?([^''"'')]+)')) {
        $resolved = Resolve-CssUrl $baseUri $m.Groups[1].Value
        if ($resolved) { $refs.Add($resolved) | Out-Null }
    }

    foreach ($ref in $refs) {
        [void](Download-Url $ref)
    }

    $updatedCss = $cssText
    foreach ($ref in $refs) {
        if (-not $urlToLocal.ContainsKey($ref)) { continue }
        $localRel = To-LocalRelative $urlToLocal[$ref]
        $updatedCss = $updatedCss.Replace($ref, $localRel)
        $updatedCss = $updatedCss.Replace(($ref -replace '^https://www\.ellietech\.com', ''), $localRel)
    }

    if ($updatedCss -ne $cssText) {
        Set-Content -Path $cssPath -Value $updatedCss
    }
}

$updatedHtml = $html
foreach ($key in $urlToLocal.Keys) {
    $localRel = To-LocalRelative $urlToLocal[$key]
    $updatedHtml = $updatedHtml.Replace($key, $localRel)
}

Set-Content -Path $indexPath -Value $updatedHtml

"DOWNLOADED=$($downloaded.Count)"
"FAILED=$($failed.Count)"
if ($failed.Count -gt 0) {
    $failed | Select-Object -First 25
}
