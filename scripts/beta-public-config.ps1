# Public connection settings only; no secret credentials are read or printed.
$ErrorActionPreference='Stop'
foreach($relative in @('.env.local','apps/mobile/.env.local')){
 $file=Join-Path (Split-Path $PSScriptRoot -Parent) $relative
 if(Test-Path -LiteralPath $file){foreach($line in [IO.File]::ReadAllLines($file)){
  if($line -match '^\s*(?:EXPO_PUBLIC_|NEXT_PUBLIC_)?(SUPABASE_URL|SUPABASE_PUBLISHABLE_KEY)\s*=\s*(.*?)\s*$'){
   $name=$Matches[1];$value=$Matches[2].Trim().Trim('"').Trim("'")
   if(-not [Environment]::GetEnvironmentVariable($name,'Process')){[Environment]::SetEnvironmentVariable($name,$value,'Process')}
  }
 }}
}
if(-not $env:SUPABASE_URL -or $env:SUPABASE_PUBLISHABLE_KEY -notlike 'sb_publishable_*'){throw 'Set the beta SUPABASE_URL and publishable key privately; privileged keys are not accepted.'}
