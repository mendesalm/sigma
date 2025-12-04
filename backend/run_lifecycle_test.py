import sys
from io import StringIO
import pytest

# Redireciona stdout
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

# Roda os testes com traceback curto
pytest.main(['tests/test_lodge_lifecycle.py', '--tb=short'])

sys.stdout = old_stdout
with open('test_lifecycle_results.txt', 'w') as f:
    f.write(mystdout.getvalue())
