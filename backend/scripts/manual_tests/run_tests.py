import os
import sys

import pytest

# Adicionar o diretório atual ao PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    sys.exit(pytest.main(["-v"]))
