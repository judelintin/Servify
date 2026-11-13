param([Parameter(Mandatory)][ValidateSet('Customer','Professional')][string]$Account)
$ErrorActionPreference='Stop'
$vault=Join-Path $env:LOCALAPPDATA 'ServifyBeta/controlled-accounts.xml'
$records=@(Import-Clixml -LiteralPath $vault)
if($records.Count -ne 2){throw 'Expected the existing ordered two-account vault. No credential was copied.'}
# Existing vault order is Customer, Professional; preserve it without rewriting records.
$record=$records[$(if($Account -eq 'Customer'){0}else{1})]
try{
 $credential=[PSCredential]::new($record.email,$record.password)
 Set-Clipboard -Value $credential.GetNetworkCredential().Password
 Write-Host 'Selected password copied. Use only your trusted password manager, then clear clipboard/history. No credential was printed.'
}finally{$credential=$null;$record=$null;$records=$null}
