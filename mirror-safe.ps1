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
$client.Timeout = [TimeSpan]::FromSeconds(30)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36')
$client.DefaultRequestHeaders.Referrer = [Uri]'https://www.ellietech.com/'

$urlToLocalRel = @{}
$fail = [System.Collections.Generic.List[string]]::new()

function Normalize-EllieUrl([string]$u) {
    if ([string]::IsNullOrWhiteSpace($u)) { return $null }
    $u = $u.Trim()
    if ($u.StartsWith('data:')) { return $null }
    if ($u.StartsWith('#')) { return $null }
    if ($u.StartsWith('mailto:') -or $u.StartsWith('tel:') -or $u.StartsWith('javascript:')) { return $null }
    if ($u.StartsWith('//www.ellietech.com/')) { return ('https:' + $u) }
    if ($u.StartsWith('https://www.ellietech.com/')) { return $u }
    if ($u.StartsWith('/')) { return ('https://www.ellietech.com' + $u) }
    if ($u.StartsWith('http://') -or $u.StartsWith('https://')) { return $null }
    return ('https://www.ellietech.com/' + $u.TrimStart('./'))
}

function Is-AssetUrl([string]$url) {
    try {
        $uri = [Uri]$url
        $path = $uri.AbsolutePath.ToLowerInvariant()
        if ($path -match '\.(css|js|png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|eot|map|json|avif|webm|mp4)$') { return $true }
        if ($path -like '/wp-content/*' -or $path -like '/wp-includes/*') { return $true }
        return $false
    }
    catch {
        return $false
    }
}

function Get-LocalPathFromUrl([string]$url) {
    $uri = [Uri]$url
    $rawPath = $uri.AbsolutePath.TrimStart('/')
    $safeParts = @()
    foreach ($seg in ($rawPath -split '/')) {
        if ($seg -eq '') { continue }
        $safeParts += ([regex]::Replace($seg, '[<>:"/\\|?*]', '_'))
    }
    $path = ($safeParts -join [IO.Path]::DirectorySeparatorChar)
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    if ($path.EndsWith('/')) { $path += 'index.html' }

    if ($uri.Query) {
        $ext = [IO.Path]::GetExtension($path)
        $dir = [IO.Path]::GetDirectoryName($path)
        $name = [IO.Path]::GetFileNameWithoutExtension($path)
        $hashFull = [BitConverter]::ToString([Text.Encoding]::UTF8.GetBytes($uri.Query)).Replace('-','').ToLower()
        $hash = if ($hashFull.Length -gt 12) { $hashFull.Substring(0,12) } else { $hashFull }
        $newName = if ($ext) { "$name.q$hash$ext" } else { "$name.q$hash" }
        $path = if ([string]::IsNullOrWhiteSpace($dir)) { $newName } else { Join-Path $dir $newName }
    }

    return Join-Path $assetRoot $path
}

function To-RelativeFromRoot([string]$filePath) {
    $baseUri = [Uri]((Resolve-Path $rootDir).Path + [IO.Path]::DirectorySeparatorChar)
    $targetUri = [Uri]((Resolve-Path $filePath).Path)
    return $baseUri.MakeRelativeUri($targetUri).ToString()
}

function Download-Asset([string]$url) {
    if ($urlToLocalRel.ContainsKey($url)) { return }

    try {
        $localPath = Get-LocalPathFromUrl $url
        $localDir = Split-Path -Parent $localPath
        if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Force -Path $localDir | Out-Null }
    }
    catch {
        $fail.Add(($url + ' :: local-path-error :: ' + $_.Exception.Message)) | Out-Null
        return
    }

    $ok = $false
    for ($i=0; $i -lt 3 -and -not $ok; $i++) {
        try {
            $bytes = $client.GetByteArrayAsync($url).GetAwaiter().GetResult()
            [IO.File]::WriteAllBytes($localPath, $bytes)
            $urlToLocalRel[$url] = To-RelativeFromRoot $localPath
            $ok = $true
        }
        catch {
            Start-Sleep -Milliseconds (400 * ($i + 1))
            if ($i -eq 2) {
                $fail.Add(($url + ' :: ' + $_.Exception.Message)) | Out-Null
            }
        }
    }
}

$html = Get-Content -Raw $indexPath

$collected = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

# Standard attributes
$attrPattern = '(?<attr>href|src|poster|data-src)=(?<q>["''])(?<url>[^"'']+)\k<q>'
foreach ($m in [regex]::Matches($html, $attrPattern)) {
    $n = Normalize-EllieUrl $m.Groups['url'].Value
    if ($n -and (Is-AssetUrl $n)) { $collected.Add($n) | Out-Null }
}

# srcset/data-srcset attributes
$srcsetPattern = '(?<attr>srcset|data-srcset)=(?<q>["''])(?<set>[^"'']+)\k<q>'
foreach ($m in [regex]::Matches($html, $srcsetPattern)) {
    $parts = $m.Groups['set'].Value -split ','
    foreach ($part in $parts) {
        $urlPart = ($part.Trim() -split '\s+')[0]
        $n = Normalize-EllieUrl $urlPart
        if ($n -and (Is-AssetUrl $n)) { $collected.Add($n) | Out-Null }
    }
}

foreach ($u in $collected) { Download-Asset $u }

# Rewrite standard attributes only
$updated = [regex]::Replace($html, $attrPattern, {
    param($m)
    $orig = $m.Groups['url'].Value
    $norm = Normalize-EllieUrl $orig
    if ($norm -and $urlToLocalRel.ContainsKey($norm)) {
        $q = $m.Groups['q'].Value
        $attr = $m.Groups['attr'].Value
        return "$attr=$q$($urlToLocalRel[$norm])$q"
    }
    return $m.Value
})

# Rewrite srcset/data-srcset
$updated = [regex]::Replace($updated, $srcsetPattern, {
    param($m)
    $q = $m.Groups['q'].Value
    $attr = $m.Groups['attr'].Value
    $parts = $m.Groups['set'].Value -split ','
    $newParts = foreach ($part in $parts) {
        $trim = $part.Trim()
        if ([string]::IsNullOrWhiteSpace($trim)) { continue }
        $chunks = $trim -split '\s+'
        $urlPart = $chunks[0]
        $descriptor = if ($chunks.Count -gt 1) { ' ' + ($chunks[1..($chunks.Count-1)] -join ' ') } else { '' }
        $norm = Normalize-EllieUrl $urlPart
        if ($norm -and $urlToLocalRel.ContainsKey($norm)) {
            $urlPart = $urlToLocalRel[$norm]
        }
        "$urlPart$descriptor"
    }
    return "$attr=$q$($newParts -join ', ')$q"
})

Set-Content -Path $indexPath -Value $updated

"COLLECTED=$($collected.Count)"
"DOWNLOADED=$($urlToLocalRel.Count)"
"FAILED=$($fail.Count)"
if ($fail.Count -gt 0) {
    $fail | Select-Object -First 30
}
