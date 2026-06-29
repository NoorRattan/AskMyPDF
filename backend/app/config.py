from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    anthropic_api_key: str
    allowed_origins: str = "*"
    chroma_path: str = "./data/chroma"
    upload_dir: str = "./data/uploads"
    max_file_size_mb: int = 50
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k_results: int = 5
    port: int = 8000


settings = Settings()
