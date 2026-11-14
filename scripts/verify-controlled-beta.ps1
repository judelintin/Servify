param([switch]$Browser,[switch]$Isolation,[switch]$Media,[switch]$MediaBrowser,[switch]$Messaging,[switch]$MessagingBrowser)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'beta-public-config.ps1')
$vault=Join-Path $env:LOCALAPPDATA 'ServifyBeta/controlled-accounts.xml'
if(-not(Test-Path -LiteralPath $vault)){throw 'Controlled-account vault is missing; use the approved provisioning process.'}
$records=@(Import-Clixml -LiteralPath $vault)
if($records.Count -ne 2){throw 'Expected the ordered Customer/Professional test vault.'}
$accounts=@(for($i=0;$i -lt 2;$i++){@{role=@('customer','professional')[$i];email=$records[$i].email;password=([PSCredential]::new('beta',$records[$i].password)).GetNetworkCredential().Password}})
try{
 $payload=ConvertTo-Json -InputObject $accounts -Compress
 if($MessagingBrowser){$payload | node (Join-Path $PSScriptRoot 'verify-beta-messaging-browser.mjs')}elseif($Messaging){$payload | node (Join-Path $PSScriptRoot 'verify-beta-messaging.mjs')}elseif($MediaBrowser){$payload | node (Join-Path $PSScriptRoot 'verify-beta-media-browser.mjs')}elseif($Media){$payload | node (Join-Path $PSScriptRoot 'verify-beta-media.mjs')}elseif($Isolation){$payload | node (Join-Path $PSScriptRoot 'verify-beta-switch-isolation.mjs')}elseif($Browser){$payload | node (Join-Path $PSScriptRoot 'verify-controlled-beta-browser.mjs')}else{$payload | node (Join-Path $PSScriptRoot 'verify-controlled-beta.mjs')}
 if($LASTEXITCODE -ne 0){throw 'Controlled beta verification failed; review the sanitized test step.'}
}finally{$payload=$null;$accounts=$null}
