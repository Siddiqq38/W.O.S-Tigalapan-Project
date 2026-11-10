param([string]$Csv,[string]$OutDir,[string]$Voice='id-ID-ArdiNeural',[string]$Rate='-6%',[string]$Only='')
$ErrorActionPreference='Stop'
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
New-Item -ItemType Directory -Force $OutDir | Out-Null
$token='6A5AA1D4EAFF4E9FB37E23D68491D6F4'
function Get-Gec{
 $ticks=[int64](([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()+11644473600)*10000000)
 $ticks=$ticks-($ticks%3000000000)
 $sha=[Security.Cryptography.SHA256]::Create()
 $b=$sha.ComputeHash([Text.Encoding]::ASCII.GetBytes("$ticks$token"))
 return (($b|ForEach-Object{$_.ToString('X2')}) -join '')
}
function Synth([string]$text,[string]$outFile){
 $gec=Get-Gec;$rid=([guid]::NewGuid().ToString('N'))
 $url="wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=$token&Sec-MS-GEC=$gec&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=$rid"
 $ws=New-Object System.Net.WebSockets.ClientWebSocket
 $ws.Options.SetRequestHeader('Origin','chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold')
 $ct=[Threading.CancellationToken]::None
 try{$ws.ConnectAsync([uri]$url,$ct).Wait()}catch{$e=$_.Exception;while($e.InnerException){$e=$e.InnerException};throw ("Gagal sambung: "+$e.Message)}
 $ts=[DateTime]::UtcNow.ToString("ddd MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'",[Globalization.CultureInfo]::InvariantCulture)
 $cfg="X-Timestamp:$ts`r`nContent-Type:application/json; charset=utf-8`r`nPath:speech.config`r`n`r`n"+'{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}'+"`r`n"
 $esc=[Security.SecurityElement]::Escape($text)
 $ssml="X-RequestId:$rid`r`nContent-Type:application/ssml+xml`r`nX-Timestamp:$ts`r`nPath:ssml`r`n`r`n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='id-ID'><voice name='$Voice'><prosody pitch='+0Hz' rate='$Rate' volume='+0%'>$esc</prosody></voice></speak>"
 foreach($m in @($cfg,$ssml)){$bytes=[Text.Encoding]::UTF8.GetBytes($m);$ws.SendAsync([ArraySegment[byte]]::new($bytes),[Net.WebSockets.WebSocketMessageType]::Text,$true,$ct).Wait()}
 $ms=New-Object IO.MemoryStream;$buf=New-Object byte[] 65536;$done=$false
 while(-not $done){
  $seg=New-Object IO.MemoryStream
  do{$r=$ws.ReceiveAsync([ArraySegment[byte]]::new($buf),$ct).Result;if($r.MessageType -eq 'Close'){$done=$true;break};$seg.Write($buf,0,$r.Count)}while(-not $r.EndOfMessage)
  if($done){break}
  $data=$seg.ToArray()
  if($r.MessageType -eq 'Text'){$t=[Text.Encoding]::UTF8.GetString($data);if($t -match 'Path:turn\.end'){$done=$true}}
  else{if($data.Length -ge 2){$hl=($data[0]*256)+$data[1];$hdr=[Text.Encoding]::UTF8.GetString($data,2,$hl);if($hdr -match 'Path:audio'){$st=2+$hl;if($data.Length -gt $st){$ms.Write($data,$st,$data.Length-$st)}}}}
 }
 try{$ws.CloseAsync('NormalClosure','',$ct).Wait(2000)|Out-Null}catch{}
 [IO.File]::WriteAllBytes($outFile,$ms.ToArray());return $ms.Length
}
$rows=Import-Csv -Path $Csv -Encoding UTF8
foreach($row in $rows){
 if($Only -and $row.Frame -notlike $Only){continue}
 $f=Join-Path $OutDir ($row.Frame+'.mp3')
 $n=Synth $row.'Narasi suara' $f
 Write-Host ("{0}: {1} byte" -f $row.Frame,$n)
}
