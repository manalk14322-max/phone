$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Get-Location
$productsPath = Join-Path $root "products.json"
$outputDir = Join-Path $root "assets\branded-products"

if (-not (Test-Path $productsPath)) {
  throw "products.json not found."
}

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" } |
  Select-Object -First 1

if (-not $jpegCodec) {
  throw "JPEG encoder not available."
}

$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  [long]82
)

function Save-AsJpeg {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$Bitmap,
    [Parameter(Mandatory = $true)][string]$Path
  )
  $Bitmap.Save($Path, $jpegCodec, $encParams)
}

function Draw-BrandWatermark {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height
  )
  $text = "The World Mobile"
  $fontSize = [Math]::Max(18, [int]($Width * 0.03))
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  try {
    $sizeObj = $Graphics.MeasureString($text, $font)
    if ($sizeObj -is [System.Array]) {
      $sizeObj = $sizeObj[0]
    }
    $size = [System.Drawing.SizeF]$sizeObj
    $padX = [Math]::Max(8, [int]($Width * 0.012))
    $padY = [Math]::Max(6, [int]($Height * 0.01))
    $x = [Math]::Max(0, [int]($Width - $size.Width - ($padX * 2) - 12))
    $y = [Math]::Max(0, [int]($Height - $size.Height - ($padY * 2) - 10))
    $rect = New-Object System.Drawing.Rectangle($x, $y, [int]($size.Width + ($padX * 2)), [int]($size.Height + ($padY * 2)))

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(165, 10, 44, 106))
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
    $outlinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
    try {
      $Graphics.FillRectangle($bgBrush, $rect)
      $Graphics.DrawRectangle($outlinePen, $rect)
      $Graphics.DrawString($text, $font, $textBrush, $x + $padX, $y + $padY)
    } finally {
      $bgBrush.Dispose()
      $textBrush.Dispose()
      $outlinePen.Dispose()
    }
  } finally {
    $font.Dispose()
  }
}

function New-BrandedFromSource {
  param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [Parameter(Mandatory = $true)][string]$OutputPath
  )
  $img = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $canvasW = [int]$bmp.Width
        $canvasH = [int]$bmp.Height
        $rect = New-Object System.Drawing.Rectangle(0, 0, $canvasW, $canvasH)
        $g.DrawImage($img, $rect)

        # Slight visual changes without destroying product visibility.
        $brightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 255, 255, 255))
        $toneBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(14, 9, 34, 82))
        try {
          $g.FillRectangle($brightBrush, $rect)
          $g.FillRectangle($toneBrush, $rect)
        } finally {
          $brightBrush.Dispose()
          $toneBrush.Dispose()
        }

        $overlayH = [Math]::Max(80, [int]($canvasH * 0.17))
        $overlayY = [int]($canvasH - $overlayH)
        $overlayRect = New-Object System.Drawing.Rectangle(0, $overlayY, $canvasW, $overlayH)
        $overlayBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
          $overlayRect,
          [System.Drawing.Color]::FromArgb(25, 13, 44, 98),
          [System.Drawing.Color]::FromArgb(170, 13, 44, 98),
          90
        )
        try {
          $g.FillRectangle($overlayBrush, $overlayRect)
        } finally {
          $overlayBrush.Dispose()
        }

        Draw-BrandWatermark -Graphics $g -Width $canvasW -Height $canvasH
      } finally {
        $g.Dispose()
      }
      Save-AsJpeg -Bitmap $bmp -Path $OutputPath
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $img.Dispose()
  }
}

function New-BrandedFallback {
  param(
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Category,
    [Parameter(Mandatory = $true)][string]$Sku
  )

  $w = 1000
  $h = 1000
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  try {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

      $bgRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
      $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.Color]::FromArgb(9, 43, 106),
        [System.Drawing.Color]::FromArgb(255, 136, 0),
        35
      )
      try {
        $g.FillRectangle($grad, $bgRect)
      } finally {
        $grad.Dispose()
      }

      $panel = New-Object System.Drawing.Rectangle(80, 120, 840, 760)
      $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 245, 249, 255))
      $panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, 255, 255, 255), 2)
      try {
        $g.FillRectangle($panelBrush, $panel)
        $g.DrawRectangle($panelPen, $panel)
      } finally {
        $panelBrush.Dispose()
        $panelPen.Dispose()
      }

      $title = "THE WORLD MOBILE"
      $catLine = if ([string]::IsNullOrWhiteSpace($Category)) { "ACCESSORY" } else { $Category.ToUpper() }
      $safeName = if ($Name.Length -gt 44) { $Name.Substring(0, 44) + "..." } else { $Name }
      $skuLine = if ([string]::IsNullOrWhiteSpace($Sku)) { "SKU 0000" } else { "SKU $Sku" }

      $f1 = New-Object System.Drawing.Font("Segoe UI", 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $f2 = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $f3 = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
      $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(17, 52, 112))
      try {
        $g.DrawString($title, $f1, $brush, 120, 260)
        $g.DrawString($catLine, $f2, $brush, 120, 360)
        $g.DrawString($safeName, $f3, $brush, 120, 445)
        $g.DrawString($skuLine, $f3, $brush, 120, 500)
      } finally {
        $f1.Dispose()
        $f2.Dispose()
        $f3.Dispose()
        $brush.Dispose()
      }

      Draw-BrandWatermark -Graphics $g -Width $w -Height $h
    } finally {
      $g.Dispose()
    }

    Save-AsJpeg -Bitmap $bmp -Path $OutputPath
  } finally {
    $bmp.Dispose()
  }
}

$products = Get-Content $productsPath -Raw | ConvertFrom-Json

$unique = [System.Collections.Generic.List[object]]::new()
$seen = @{}
foreach ($p in $products) {
  $img = [string]$p.image
  if ([string]::IsNullOrWhiteSpace($img)) { continue }
  if ($seen.ContainsKey($img)) { continue }
  $seen[$img] = $true
  $unique.Add([pscustomobject]@{
      image    = $img
      name     = [string]$p.name
      category = [string]$p.category
      id       = [string]$p.id
    })
}

$map = @{}
$created = 0
$fallback = 0
$failed = 0
$failSamples = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $unique.Count; $i++) {
  $maxImages = 0
  try { $maxImages = [int]$env:TWM_MAX_IMAGES } catch { $maxImages = 0 }
  if ($maxImages -gt 0 -and $i -ge $maxImages) { break }

  $u = $unique[$i]
  $idx = $i + 1
  $fileName = "the-world-mobile-product-{0:d4}.jpg" -f $idx
  $destAbs = Join-Path $outputDir $fileName
  $destRel = ("assets/branded-products/" + $fileName).Replace("\", "/")
  $map[$u.image] = $destRel

  $srcRel = [string]$u.image
  $srcAbs = Join-Path $root $srcRel

  try {
    if (Test-Path $srcAbs) {
      $ext = [System.IO.Path]::GetExtension($srcAbs).ToLowerInvariant()
      if ($ext -in @(".jpg", ".jpeg", ".png")) {
        New-BrandedFromSource -SourcePath $srcAbs -OutputPath $destAbs
        $created++
      } else {
        New-BrandedFallback -OutputPath $destAbs -Name ([string]$u.name) -Category ([string]$u.category) -Sku ([string]$u.id)
        $fallback++
      }
    } else {
      New-BrandedFallback -OutputPath $destAbs -Name ([string]$u.name) -Category ([string]$u.category) -Sku ([string]$u.id)
      $fallback++
    }
  } catch {
    $failed++
    if ($failSamples.Count -lt 20) {
      $failSamples.Add(("{0} => {1} || {2}" -f $srcRel, $_.Exception.Message, $_.ScriptStackTrace))
    }
    New-BrandedFallback -OutputPath $destAbs -Name ([string]$u.name) -Category ([string]$u.category) -Sku ([string]$u.id)
    $fallback++
  }
}

foreach ($p in $products) {
  $old = [string]$p.image
  if ($map.ContainsKey($old)) {
    $p.image = $map[$old]
  }
}

$products | ConvertTo-Json -Depth 8 | Set-Content $productsPath -Encoding UTF8

$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  totalProducts = $products.Count
  uniqueSourceImages = $unique.Count
  createdFromSource = $created
  fallbackGenerated = $fallback
  failedSourceRead = $failed
  failureSamples = $failSamples
  outputDirectory = "assets/branded-products"
}
$report | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $root "image-branding-report.json") -Encoding UTF8

Write-Output ("DONE | total={0} unique={1} fromSource={2} fallback={3} failed={4}" -f $products.Count, $unique.Count, $created, $fallback, $failed)
