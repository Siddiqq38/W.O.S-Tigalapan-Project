param([string]$Html,[string]$OutDir,[int]$Port=9333,[string]$Only='',[string]$Probe='',[int]$W=1920,[int]$H=1080,[switch]$Mobile,[string]$UA='',[string]$FrameVar='')
$ErrorActionPreference='Stop'
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$ud=Join-Path $env:TEMP ("sb-edge-"+$Port); if(Test-Path $ud){Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue}
New-Item -ItemType Directory -Force $OutDir | Out-Null
$url="file:///"+($Html.Replace('\','/'))
$proc=Start-Process $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--user-data-dir=$ud","--remote-debugging-port=$Port","--window-size=1920,1080",$url) -PassThru
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
  $buf=New-Object byte[] 262144
  while($true){
   $sb=New-Object Text.StringBuilder
   do{$r=$c.ReceiveAsync([ArraySegment[byte]]::new($buf),[Threading.CancellationToken]::None).Result;[void]$sb.Append([Text.Encoding]::UTF8.GetString($buf,0,$r.Count))}while(-not $r.EndOfMessage)
   $o=$sb.ToString()|ConvertFrom-Json
   if($o.id -eq $my){return $o}
  }}
 function Eval($js){$r=Send 'Runtime.evaluate' @{expression=$js;awaitPromise=$true;returnByValue=$true;timeout=60000};return $r.result.result.value}
 [void](Send 'Page.enable' @{})
 [void](Send 'Emulation.setDeviceMetricsOverride' @{width=$W;height=$H;deviceScaleFactor=1;mobile=[bool]$Mobile})
 if($Mobile){[void](Send 'Emulation.setTouchEmulationEnabled' @{enabled=$true;maxTouchPoints=5})}
 if($UA){[void](Send 'Emulation.setUserAgentOverride' @{userAgent=$UA});[void](Send 'Page.reload' @{});Start-Sleep -Seconds 3}
 Start-Sleep -Seconds 4
 $prep=Eval 'window.__sbPrep?window.__sbPrep():"none"'
 if($prep -eq 'reload'){[void](Send 'Page.reload' @{});Start-Sleep -Seconds 6}
 $n=[int](Eval 'window.__frames?window.__frames.length:0')
 Write-Host "frames: $n"
 for($i=0;$i -lt $n;$i++){
  $fid=Eval "window.__frames[$i].id"
  if($Only -and $fid -notlike $Only){continue}
  $got=Eval "window.__sbRun($i)"
  $shot=Send 'Page.captureScreenshot' @{format='png'}
  [IO.File]::WriteAllBytes((Join-Path $OutDir ($fid+'.png')),[Convert]::FromBase64String($shot.result.data))
  Write-Host "ok $fid"
 }
 if($Probe){Write-Host ("PROBE: "+(Eval $Probe))}
 $err=Eval 'window.__sbErr||""'
 if($err){Write-Host "GALAT SETUP:`n$err"}
}finally{try{$proc.Kill()}catch{}}
