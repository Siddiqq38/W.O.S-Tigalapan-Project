param([string]$Html,[string]$OutDir,[string]$Prefix,[string]$Selector,[int]$Width,[int]$Height,[double]$Scale=1,[string]$Pdf='',[double]$PaperW=0,[double]$PaperH=0,[int]$Port=9344)
$ErrorActionPreference='Stop'
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$ud=Join-Path $env:TEMP ("sh-edge-"+$Port); if(Test-Path $ud){Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue}
New-Item -ItemType Directory -Force $OutDir | Out-Null
$url="file:///"+($Html.Replace('\','/'))
$proc=Start-Process $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--user-data-dir=$ud","--remote-debugging-port=$Port","--window-size=$Width,$Height",$url) -PassThru
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
 [void](Send 'Emulation.setDeviceMetricsOverride' @{width=$Width;height=$Height;deviceScaleFactor=1;mobile=$false})
 Start-Sleep -Seconds 4
 $n=[int](Eval "document.querySelectorAll('$Selector').length")
 Write-Host "elemen: $n"
 for($i=0;$i -lt $n;$i++){
  $rect=Eval "(function(){var e=document.querySelectorAll('$Selector')[$i];var r=e.getBoundingClientRect();return JSON.stringify({x:r.left+window.scrollX,y:r.top+window.scrollY,w:r.width,h:r.height})})()"|ConvertFrom-Json
  $shot=Send 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$true;clip=@{x=$rect.x;y=$rect.y;width=$rect.w;height=$rect.h;scale=$Scale}}
  $name=('{0}{1:D2}.png' -f $Prefix,($i+1))
  [IO.File]::WriteAllBytes((Join-Path $OutDir $name),[Convert]::FromBase64String($shot.result.data))
  Write-Host "ok $name"
 }
 if($Pdf){
  $pp=@{printBackground=$true;preferCSSPageSize=$true}
  if($PaperW -gt 0){$pp.paperWidth=$PaperW;$pp.paperHeight=$PaperH;$pp.marginTop=0;$pp.marginBottom=0;$pp.marginLeft=0;$pp.marginRight=0}
  $r=Send 'Page.printToPDF' $pp
  [IO.File]::WriteAllBytes($Pdf,[Convert]::FromBase64String($r.result.data));Write-Host "pdf ok"
 }
}finally{try{$proc.Kill()}catch{}}
