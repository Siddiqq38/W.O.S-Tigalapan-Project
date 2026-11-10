param([string]$Csv,[string]$OutDir,[string]$Voice='id-ID-ArdiNeural',[string]$Rate='-6%',[string]$Only='',[string]$TestText='',[int]$Port=9620)
$ErrorActionPreference='Stop'
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$html=Join-Path $PSScriptRoot 'tts_page.html'
$ud=Join-Path $env:TEMP ("tts-edge-"+$Port); if(Test-Path $ud){Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue}
New-Item -ItemType Directory -Force $OutDir | Out-Null
$proc=Start-Process $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--user-data-dir=$ud","--remote-debugging-port=$Port","file:///"+$html.Replace('\','/')) -PassThru
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
 function Synth($text,$file){
  $js="window.__tts("+($text|ConvertTo-Json)+","+($Voice|ConvertTo-Json)+","+($Rate|ConvertTo-Json)+")"
  $r=Send 'Runtime.evaluate' @{expression=$js;awaitPromise=$true;returnByValue=$true;timeout=70000}
  $v=[string]$r.result.result.value
  if(-not $v.StartsWith('OK ')){Write-Host "GAGAL: $v $($r.result.exceptionDetails.text)";return 0}
  $b=[Convert]::FromBase64String($v.Substring(3));[IO.File]::WriteAllBytes($file,$b);return $b.Length}
 [void](Send 'Page.enable' @{});Start-Sleep -Seconds 2
 if($TestText){$n=Synth $TestText (Join-Path $OutDir 'uji.mp3');Write-Host "uji: $n byte"}
 else{
  $rows=Import-Csv -Path $Csv -Encoding UTF8
  foreach($row in $rows){if($Only -and $row.Frame -notlike $Only){continue}
   $n=Synth $row.'Narasi suara' (Join-Path $OutDir ($row.Frame+'.mp3'));Write-Host ("{0}: {1} byte" -f $row.Frame,$n)}
 }
}finally{try{$proc.Kill()}catch{}}
