import os
import tempfile

import pytest

os.environ.setdefault("DATABASE_URL", "sqlite:///./backend_test.db")


@pytest.fixture(autouse=True, scope="session")
def prepare_db():
    # Ensure DB file is clean
    db_file = os.path.join(os.getcwd(), "backend_test.db")
    try:
        if os.path.exists(db_file):
            os.remove(db_file)
    except Exception:
        pass
    yield
    try:
        if os.path.exists(db_file):
            os.remove(db_file)
    except Exception:
        pass
