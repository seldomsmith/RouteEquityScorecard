$content = Get-Content -Path 'src\components\Scrollytelling.tsx' -Raw
$idx = $content.IndexOf('return (')
if ($idx -eq -1) { Write-Host "return not found"; exit }
$jsx = $content.Substring($idx)

$jsx = $jsx -replace '\{\/\*.*?\*\/\}', ''
$jsx = $jsx -replace '"[^"\\]*(?:\\.[^"\\]*)*"', '""'
$jsx = $jsx -replace "'[^'\\]*(?:\\.[^'\\]*)*'", "''"

$matches = [regex]::Matches($jsx, '(?s)<\/?([a-zA-Z0-9]+)[^>]*>')
$stack = @()

foreach ($match in $matches) {
    $tag = $match.Value
    $name = $match.Groups[1].Value
    
    if ($tag.EndsWith('/>') -or $tag.StartsWith('</>')) {
        continue
    }

    if ($tag.StartsWith('</')) {
        if ($stack.Count -eq 0) {
            Write-Host "Unmatched closing tag: $name at index $($match.Index)"
            exit
        }
        $top = $stack[-1]
        $stack = $stack[0..($stack.Count - 2)]
        if ($top.Name -ne $name) {
            $prefix = $content.Substring(0, $idx + $match.Index)
            $lines = ($prefix -split "`n").Count
            Write-Host "Mismatched tag at line $lines! Expected </$($top.Name)> (opened at line $($top.Line)) but found </$name>"
            exit
        }
    } else {
        $prefix = $content.Substring(0, $idx + $match.Index)
        $lines = ($prefix -split "`n").Count
        $stack += @{ Name = $name; Line = $lines }
    }
}
