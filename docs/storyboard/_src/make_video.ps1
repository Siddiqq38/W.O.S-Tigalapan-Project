param([string]$Dir,[string]$Out,[int]$Port=9660,[string]$Mime='video/mp4;codecs=avc1.42E01E,mp4a.40.2')
$ErrorActionPreference='Stop'
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$html=Join-Path $PSScriptRoot 'video_page.html'
$ud=Join-Path $env:TEMP ("vid-edge-"+$Port); if(Test-Path $ud){Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue}
$rows=Import-Csv -Path (Join-Path $Dir 'narasi.csv') -Encoding UTF8
$slides=@()
foreach($r in $rows){
 $img=Join-Path $Dir ("frames\"+$r.Frame+".png");$aud=Join-Path $Dir ("audio\"+$r.Frame+".mp3")
 $sec=[Math]::Max(9,[Math]::Ceiling(($r.'Narasi tampil'.Length)/12)+4)
 $slides+=[pscustomobject]@{img=("file:///"+$img.Replace('\','/'));sec=$sec;audio=$(if(Test-Path $aud){"file:///"+$aud.Replace('\','/')}else{''})}
}
$proc=Start-Process $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--autoplay-policy=no-user-gesture-required","--user-data-dir=$ud","--remote-debugging-port=$Port","--window-size=1920,1080","about:blank") -PassThru
try{
 $tabs=$null;for($i=0;$i -lt 40;$i++){try{$tabs=Invoke-RestMethod "http://127.0.0.1:$Port/json" -TimeoutSec 2;if($tabs){break}}catch{};Start-Sleep -Milliseconds 500}
 $page=$tabs|Where-Object{$_.type -eq 'page'}|Select-Object -First 1
 $c=New-Object System.Net.WebSockets.ClientWebSocket
 $c.ConnectAsync([uri]$page.webSocketDebuggerUrl,[Threading.CancellationToken]::None).Wait()
 $script:id=0
 function Send($method,$params){
  $script:id++;$my=$script:id
  $json=@{id=$my;method=$method;params=$params}|ConvertTo-Json -Depth 20 -Compress
  $bytes=[Text.Encoding]::UTF8.GetBytes($json)
  $c.SendAsync([ArraySegment[byte]]::new($bytes),[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).Wait()
  $buf=New-Object byte[] 1048576
  while($true){
   $sb=New-Object Text.StringBuilder
   do{$r=$c.ReceiveAsync([ArraySegment[byte]]::new($buf),[Threading.CancellationToken]::None).Result;[void]$sb.Append([Text.Encoding]::UTF8.GetString($buf,0,$r.Count))}while(-not $r.EndOfMessage)
   $o=$sb.ToString()|ConvertFrom-Json
   if($o.id -eq $my){return $o}
  }}
 function Eval($js,$to=60000){$r=Send 'Runtime.evaluate' @{expression=$js;awaitPromise=$true;returnByValue=$true;timeout=$to};if($r.result.exceptionDetails){throw ("JS: "+$r.result.exceptionDetails.exception.description)};return $r.result.result.value}
 [void](Send 'Page.enable' @{});[void](Send 'Page.navigate' @{url=("file:///"+$html.Replace('\','/'))});Start-Sleep -Seconds 3
 $json=($slides|ConvertTo-Json -Depth 5 -Compress);if($slides.Count -eq 1){$json="["+$json+"]"}
 Write-Host ("Merekam "+$slides.Count+" slide, total sekitar "+(($slides|Measure-Object sec -Sum).Sum)+" detik (waktu nyata)...")
 $res=Eval ("window.__rec("+$json+","+($Mime|ConvertTo-Json)+",25)") 1500000
 Write-Host "Hasil: $res"
 $size=[int](($res -split ' ')[1]);$n=1000000;$count=[Math]::Ceiling($size/$n)
 $fs=[IO.File]::Create($Out)
 for($i=0;$i -lt $count;$i++){$b64=Eval "window.__chunk($i,$n)" 120000;$bytes=[Convert]::FromBase64String($b64);$fs.Write($bytes,0,$bytes.Length)}
 $fs.Close();Write-Host ("Tersimpan: "+$Out+" ("+(Get-Item $Out).Length+" byte)")
}finally{try{$proc.Kill()}catch{}}
