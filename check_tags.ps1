$content = Get-Content -Path 'src\components\Scrollytelling.tsx' -Raw
$idx = $content.IndexOf('return (')
if ($idx -eq -1) { Write-Host "return not found"; exit }
$jsx = $content.Substring($idx)

# Remove comments
$jsx = $jsx -replace '\{\/\*.*?\*\/\}', ''

# Extract all tags
$matches = [regex]::Matches($jsx, '<\/?([a-zA-Z0-9]+)[^>]*>')
$stack = @()

foreach ($match in $matches) {
    $tag = $match.Value
    $name = $match.Groups[1].Value

    if ($tag.EndsWith('/>') -or $tag.StartsWith('</>')) {
        continue
    }

    if ($tag.StartsWith('</')) {
        if ($stack.Count -eq 0) {
            Write-Host "Unmatched closing tag: $name"
            exit
        }
        $top = $stack[-1]
        $stack = $stack[0..($stack.Count - 2)]
        if ($top -ne $name) {
            Write-Host "Mismatched tag! Expected </$top> but found </$name>"
            exit
        }
    } else {
        $stack += $name
    }
}

if ($stack.Count -gt 0) {
    Write-Host "Unclosed tags: $($stack -join ', ')"
} else {
    Write-Host "All tags matched!"
}
