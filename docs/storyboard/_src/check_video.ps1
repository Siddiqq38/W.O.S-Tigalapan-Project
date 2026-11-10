param([string]$File,[int]$Port=9740,[double[]]$At=@(5,60,200))
$ErrorActionPreference='Stop'
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$ud=Join-Path $env:TEMP ("chk-vid-"+$Port); if(Test-Path $ud){Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue}
$proc=Start-Process $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--autoplay-policy=no-user-gesture-required","--user-data-dir=$ud","--remote-debugging-port=$Port","--window-size=1280,720","about:blank") -PassThru
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
 function Eval($js,$to=60000){$r=Send 'Runtime.evaluate' @{expression=$js;awaitPromise=$true;returnByValue=$true;timeout=$to};return $r.result.result.value}
 [void](Send 'Page.enable' @{})
 [void](Send 'Page.navigate' @{url=("file:///"+$File.Replace('\','/'))});Start-Sleep -Seconds 4
 Write-Host ("info: "+(Eval "(function(){var v=document.querySelector('video');return v?('durasi='+v.duration+' lebar='+v.videoWidth+' tinggi='+v.videoHeight+' error='+(v.error?v.error.code:'-')):'tidak ada elemen video'})()"))
 $k=0
 Write-Host ("putar: "+(Eval "new Promise(function(r){var v=document.querySelector('video');v.muted=true;v.play();setTimeout(function(){r('t='+v.currentTime.toFixed(2)+' dur='+v.duration+' ended='+v.ended+' paused='+v.paused)},6000)})" 30000))
 foreach($t in $At){
  [void](Eval "new Promise(function(r){var v=document.querySelector('video');v.pause();v.onseeked=function(){r(1)};v.currentTime=$t;setTimeout(function(){r(0)},4000)})")
  Start-Sleep -Milliseconds 600
  $shot=Send 'Page.captureScreenshot' @{format='png'}
  $out=Join-Path $env:TEMP ("vidcheck_"+$k+".png");[IO.File]::WriteAllBytes($out,[Convert]::FromBase64String($shot.result.data));Write-Host "frame pada $t dtk -> $out";$k++
 }
}finally{try{$proc.Kill()}catch{}}
