import re
import sys

def check_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where the return statement starts
    return_idx = content.find('return (')
    if return_idx == -1:
        print("Could not find return statement")
        return

    jsx_content = content[return_idx:]

    # A very naive regex to find opening and closing tags.
    # It won't handle comments perfectly, but it's a start.
    # Remove JSX comments first
    jsx_content = re.sub(r'\{\/\*.*?\*\/\}', '', jsx_content, flags=re.DOTALL)

    tags = re.findall(r'<\/?([a-zA-Z0-9]+)[^>]*>', jsx_content)
    
    stack = []
    line_number = content[:return_idx].count('\n') + 1

    for match in re.finditer(r'<\/?([a-zA-Z0-9]+)[^>]*>', jsx_content):
        tag_str = match.group(0)
        tag_name = match.group(1)

        # Ignore self-closing tags
        if tag_str.endswith('/>'):
            continue

        # Ignore <br>, <hr>, <img>, <input> if they aren't explicitly closed (though in JSX they should be self-closing)
        
        if tag_str.startswith('</'):
            if not stack:
                print(f"Unmatched closing tag: {tag_name}")
                return
            top = stack.pop()
            if top != tag_name:
                print(f"Mismatched tag! Expected </{top}> but found </{tag_name}>")
                return
        else:
            stack.append(tag_name)

    if stack:
        print(f"Unclosed tags remaining in stack: {stack}")
    else:
        print("All tags appear balanced.")

if __name__ == "__main__":
    check_tags('src/components/Scrollytelling.tsx')
