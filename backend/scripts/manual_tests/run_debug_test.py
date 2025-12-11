import sys
from io import StringIO
import pytest

# Redireciona stdout
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

pytest.main(['-s', 'tests/test_lodge_lifecycle.py::test_webmaster_login_inactive_lodge'])

sys.stdout = old_stdout
with open('debug_output.txt', 'w') as f:
    f.write(mystdout.getvalue()) # Grava tudo, depois eu leio partes
