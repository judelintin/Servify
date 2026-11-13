# Trusted interactive operator only. Never run automatically or log credentials.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'beta-public-config.ps1')
$vaultDir=Join-Path $env:LOCALAPPDATA 'ServifyBeta'
$vaultPath=Join-Path $vaultDir 'controlled-accounts.xml'
if(-not(Test-Path -LiteralPath $vaultDir)){New-Item -ItemType Directory -Path $vaultDir | Out-Null}
if(Test-Path -LiteralPath $vaultPath){$accounts=@(Import-Clixml -LiteralPath $vaultPath)}else{
 $emails=@($env:SERVIFY_BETA_CUSTOMER_EMAIL,$env:SERVIFY_BETA_PROFESSIONAL_EMAIL)
 if($emails.Count -ne 2 -or @($emails | Select-Object -Unique).Count -ne 2 -or @($emails | Where-Object {$_ -notmatch '^[^@\s]+@example\.invalid$'}).Count){throw 'Set two distinct dedicated synthetic account emails privately before provisioning.'}
 $accounts=@($emails | ForEach-Object {
  $bytes=[byte[]]::new(32);[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $password=[Convert]::ToBase64String($bytes)+'Aa1!'
  [PSCustomObject]@{email=$_;password=(ConvertTo-SecureString $password -AsPlainText -Force)}
 })
 $accounts | Export-Clixml -LiteralPath $vaultPath
}
if($accounts.Count -ne 2){throw 'Expected the existing two-account vault; nothing was changed.'}
$secret=Read-Host 'Paste the beta secret/service-role key (hidden; never saved)' -AsSecureString
$keyCredential=[PSCredential]::new('beta',$secret)
$payload=@{secret=$keyCredential.GetNetworkCredential().Password;accounts=@($accounts | ForEach-Object {@{email=$_.email;password=([PSCredential]::new('beta',$_.password)).GetNetworkCredential().Password}})} | ConvertTo-Json -Depth 4 -Compress
try{$payload | node (Join-Path $PSScriptRoot 'provision-beta-accounts.mjs');if($LASTEXITCODE -ne 0){throw 'Provisioning did not complete'}}finally{$payload=$null;$secret=$null;$keyCredential=$null;$accounts=$null}
Write-Host 'Test passwords remain encrypted in the Windows user vault. Email delivery was not tested.'
