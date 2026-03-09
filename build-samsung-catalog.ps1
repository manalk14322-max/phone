$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $root) { $root = (Get-Location).Path }

$coversDir = Join-Path $root "images/samsung/covers"
$protectorsDir = Join-Path $root "images/samsung/screen-protectors"
$accessoriesDir = Join-Path $root "images/samsung/accessories"
$dataDir = Join-Path $root "data"

New-Item -ItemType Directory -Force -Path $coversDir | Out-Null
New-Item -ItemType Directory -Force -Path $protectorsDir | Out-Null
New-Item -ItemType Directory -Force -Path $accessoriesDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

function Download-Image {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$OutputPath
  )

  $headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    "Accept" = "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
  }

  try {
    $response = Invoke-WebRequest -Uri $Url -Headers $headers -UseBasicParsing -TimeoutSec 45 -OutFile $OutputPath -PassThru
    $contentType = [string]($response.Headers["Content-Type"])
    if ($contentType -and ($contentType -notmatch "^image/")) {
      Remove-Item -LiteralPath $OutputPath -Force -ErrorAction SilentlyContinue
      throw "Non-image content type: $contentType"
    }
    return @{
      ok = $true
      reason = ""
    }
  }
  catch {
    Remove-Item -LiteralPath $OutputPath -Force -ErrorAction SilentlyContinue
    return @{
      ok = $false
      reason = $_.Exception.Message
    }
  }
}

$coverSources = @(
  "https://w7.pngwing.com/pngs/850/727/png-transparent-mobile-phone-accessories-samsung-galaxy-telephone-computer-screen-protectors-phone-case-miscellaneous-gadget-electronics.png",
  "https://w7.pngwing.com/pngs/602/46/png-transparent-samsung-galaxy-mobile-phone-accessories-smartphone-battery-charger-phone-case-hd-miscellaneous-gadget-mobile-phone.png",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
  "https://www.shopify.com/stock-photos/photos/colorful-cellphone-cases/download",
  "https://www.shopify.com/stock-photos/photos/iphone-cases-for-sale/download",
  "https://images.pexels.com/photos/886521/pexels-photo-886521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/14706924/pexels-photo-14706924.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/2266642/pexels-photo-2266642.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200"
)

$protectorSources = @(
  "https://w7.pngwing.com/pngs/866/540/png-transparent-iphone-6-screen-protectors-toughened-glass-samsung-galaxy-phone-case-miscellaneous-glass-gadget.png",
  "https://images.pexels.com/photos/13570129/pexels-photo-13570129.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200"
)

$accessorySources = @(
  "https://w7.pngwing.com/pngs/778/240/png-transparent-battery-charger-mobile-phone-accessories-ampere-hour-electric-battery-samsung-galaxy-mobile-case-electronics-adapter-bluetooth.png",
  "https://w7.pngwing.com/pngs/602/46/png-transparent-samsung-galaxy-mobile-phone-accessories-smartphone-battery-charger-phone-case-hd-miscellaneous-gadget-mobile-phone.png",
  "https://www.shopify.com/stock-photos/photos/mobile-phone-and-some-accessories/download",
  "https://www.shopify.com/stock-photos/photos/colorful-cel-phone-accessory/download",
  "https://www.shopify.com/stock-photos/photos/cellphone-floats-above-light-blue-background/download",
  "https://www.shopify.com/stock-photos/photos/iphone-cases-for-sale/download",
  "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/886521/pexels-photo-886521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200"
)

$models = @(
  "Galaxy S24 Ultra",
  "Galaxy S24 Plus",
  "Galaxy S24",
  "Galaxy S23 Ultra",
  "Galaxy S23",
  "Galaxy S22",
  "Galaxy A55",
  "Galaxy A54",
  "Galaxy A35",
  "Galaxy A34",
  "Galaxy Note20 Ultra",
  "Galaxy Z Fold5"
)

function Slug-Model {
  param([string]$Model)
  $slug = $Model.ToLowerInvariant()
  $slug = $slug -replace "\+", "plus"
  $slug = $slug -replace "[^a-z0-9]+", "-"
  $slug = $slug.Trim("-")
  return $slug
}

function Get-SourceType {
  param([string]$url)
  if ($url -match "unsplash\.com") { return "Unsplash" }
  if ($url -match "shopify\.com/stock-photos") { return "Burst (Shopify)" }
  if ($url -match "pngwing\.com") { return "PNGWing (Free PNG)" }
  if ($url -match "freepngimg\.com") { return "Free PNG Source" }
  return "Pexels"
}

$downloadLog = @()
$sourceMeta = @()

for ($i = 0; $i -lt $models.Count; $i++) {
  $model = $models[$i]
  $slug = Slug-Model $model

  $coverName = "samsung-$slug-cover.jpg"
  $coverPath = Join-Path $coversDir $coverName
  $coverUrl = $coverSources[$i % $coverSources.Count]
  $coverResult = Download-Image -Url $coverUrl -OutputPath $coverPath
  $downloadLog += [pscustomobject]@{
    file = "images/samsung/covers/$coverName"
    source = $coverUrl
    category = "cover"
    ok = $coverResult.ok
    reason = $coverResult.reason
  }
  $sourceMeta += [pscustomobject]@{
    file = "images/samsung/covers/$coverName"
    sourceUrl = $coverUrl
    sourceType = Get-SourceType $coverUrl
    licenseNote = "Royalty-free stock source. Verify final commercial terms per source page."
  }

  $protName = "samsung-$slug-screen-protector.jpg"
  $protPath = Join-Path $protectorsDir $protName
  $protUrl = $protectorSources[$i % $protectorSources.Count]
  $protResult = Download-Image -Url $protUrl -OutputPath $protPath
  $downloadLog += [pscustomobject]@{
    file = "images/samsung/screen-protectors/$protName"
    source = $protUrl
    category = "screen-protector"
    ok = $protResult.ok
    reason = $protResult.reason
  }
  $sourceMeta += [pscustomobject]@{
    file = "images/samsung/screen-protectors/$protName"
    sourceUrl = $protUrl
    sourceType = Get-SourceType $protUrl
    licenseNote = "Royalty-free stock source. Verify final commercial terms per source page."
  }

  $accName = "samsung-$slug-accessory.jpg"
  $accPath = Join-Path $accessoriesDir $accName
  $accUrl = $accessorySources[$i % $accessorySources.Count]
  $accResult = Download-Image -Url $accUrl -OutputPath $accPath
  $downloadLog += [pscustomobject]@{
    file = "images/samsung/accessories/$accName"
    source = $accUrl
    category = "accessory"
    ok = $accResult.ok
    reason = $accResult.reason
  }
  $sourceMeta += [pscustomobject]@{
    file = "images/samsung/accessories/$accName"
    sourceUrl = $accUrl
    sourceType = Get-SourceType $accUrl
    licenseNote = "Royalty-free stock source. Verify final commercial terms per source page."
  }
}

$okFiles = $downloadLog | Where-Object { $_.ok }
$fallback = $okFiles | Select-Object -First 1
if ($fallback) {
  $fallbackFull = Join-Path $root $fallback.file
  foreach ($item in ($downloadLog | Where-Object { -not $_.ok })) {
    $target = Join-Path $root $item.file
    Copy-Item -LiteralPath $fallbackFull -Destination $target -Force
  }
}

$reportPath = Join-Path $dataDir "samsung-image-download-report.json"
$downloadLog | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding UTF8

$sourcePath = Join-Path $dataDir "samsung-image-sources.json"
$sourceMeta | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $sourcePath -Encoding UTF8

# Build Samsung curated product list
$productFile = Join-Path $root "products.json"
$allProducts = Get-Content -LiteralPath $productFile -Raw | ConvertFrom-Json

$filteredExisting = @($allProducts | Where-Object { $_.sourceTag -ne "samsung-curated-2026" })

$newProducts = @()
$nextId = 960001

for ($i = 0; $i -lt $models.Count; $i++) {
  $model = $models[$i]
  $slug = Slug-Model $model

  $coverImage = "images/samsung/covers/samsung-$slug-cover.jpg"
  $cover = [pscustomobject]@{
    id = $nextId
    name = "Samsung $model Premium Shockproof Cover"
    category = "FUNDA"
    tags = @("Samsung", "Cover", "Shockproof", $model)
    price = "EUR 12.90"
    image = $coverImage
    brand = "Samsung"
    compatibleModel = $model
    shortDescription = "Slim fit anti-drop cover designed for Samsung $model with camera protection."
    sourceTag = "samsung-curated-2026"
  }
  $nextId++

  $protImage = "images/samsung/screen-protectors/samsung-$slug-screen-protector.jpg"
  $protector = [pscustomobject]@{
    id = $nextId
    name = "Samsung $model 9H Tempered Glass Screen Protector"
    category = "PROTECTORES PANTALLA"
    tags = @("Samsung", "Screen Protector", "9H Glass", $model)
    price = "EUR 8.90"
    image = $protImage
    brand = "Samsung"
    compatibleModel = $model
    shortDescription = "High-clarity tempered glass for Samsung $model with anti-scratch daily protection."
    sourceTag = "samsung-curated-2026"
  }
  $nextId++

  $accessoryImage = "images/samsung/accessories/samsung-$slug-accessory.jpg"
  $accessoryTypes = @(
    "25W USB-C Fast Charger",
    "Braided USB-C Data Cable",
    "Magnetic Car Mount",
    "Wireless Charging Stand",
    "Bluetooth Earbuds",
    "Compact Power Bank"
  )
  $accType = $accessoryTypes[$i % $accessoryTypes.Count]
  $accessory = [pscustomobject]@{
    id = $nextId
    name = "Samsung $model Compatible $accType"
    category = "ACCESORIOS"
    tags = @("Samsung", "Accessory", $accType, $model)
    price = "EUR 15.90"
    image = $accessoryImage
    brand = "Samsung"
    compatibleModel = $model
    shortDescription = "Reliable $accType tuned for Samsung users and daily business/retail sales."
    sourceTag = "samsung-curated-2026"
  }
  $nextId++

  $newProducts += $cover
  $newProducts += $protector
  $newProducts += $accessory
}

$merged = @($newProducts + $filteredExisting)
$merged | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $productFile -Encoding UTF8

$samsungDataPath = Join-Path $dataDir "samsung-products.json"
$newProducts | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $samsungDataPath -Encoding UTF8

Write-Host "Samsung catalog refresh complete."
Write-Host ("New products added: " + $newProducts.Count)
Write-Host ("Images prepared: " + ($downloadLog.Count))
