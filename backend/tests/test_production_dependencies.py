from pathlib import Path


def _read_requirements(filename: str) -> str:
    lines = (Path(__file__).resolve().parents[1] / filename).read_text(encoding="utf-8").splitlines()
    return "\n".join(line for line in lines if line.strip() and not line.lstrip().startswith("#"))


def test_render_requirements_exclude_heavy_ml_stack():
    requirements = _read_requirements("requirements-prod.txt").lower()

    blocked_packages = {
        "sentence-transformers",
        "torch",
        "numpy",
        "pymupdf",
        "pytest",
        "reportlab",
    }

    for package in blocked_packages:
        assert package not in requirements


def test_render_requirements_keep_runtime_packages():
    requirements = _read_requirements("requirements-prod.txt").lower()

    required_packages = {
        "fastapi",
        "uvicorn",
        "python-multipart",
        "pydantic",
        "pydantic-settings",
        "pdfplumber",
        "pypdf",
        "groq",
        "anthropic",
        "httpx",
    }

    for package in required_packages:
        assert package in requirements
