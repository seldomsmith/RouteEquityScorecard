$content = Get-Content -Path 'src\components\Scrollytelling.tsx' -Raw
$idx = $content.IndexOf('return (')
$jsx = $content.Substring($idx)
$jsx = $jsx -replace '\{\/\*.*?\*\/\}', ''
$matches = [regex]::Matches($jsx, '(?s)<\/?([a-zA-Z0-9]+)[^>]*>')

$out = @()
foreach ($match in $matches) {
    $out += $match.Value
}
$out | Out-File tags.txt
