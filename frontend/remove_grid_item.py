import os
import re

path = 'src'
count = 0
for root, _, files in os.walk(path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix <Grid item ...> back to <Grid ...>
            new_content = re.sub(r'<Grid([^>]*)(\s+item)\b([^>]*)>', r'<Grid\1\3>', content)
            
            if new_content != content:
                print(f'Removed item from {filepath}')
                count += 1
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
print(f"Removed item prop from {count} files")
