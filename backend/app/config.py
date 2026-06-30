from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    groq_api_key: str
    allowed_origins: str = "*"
    allowed_origin_regex: str | None = None
    upload_dir: str = "./data/uploads"
    max_file_size_mb: int = 50
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k_results: int = 5
    embedding_dimensions: int = 256
    max_sessions: int = 20
    port: int = 8000


settings = Settings()
