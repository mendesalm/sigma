import os
import re

path = 'src'
for root, _, files in os.walk(path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Temporarily rename <Grid> to <Grid2> and import it as such
            new_content = re.sub(r'\bGrid\b', 'Grid2', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
