from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    anthropic_api_key: str | None = None
    allowed_origins: str = "*"
    allowed_origin_regex: str | None = None
    upload_dir: str = "./data/uploads"
    max_file_size_mb: int = 50
    chunk_size: int = 1200
    chunk_overlap: int = 0
    upload_embedding_batch_size: int = 256
    upload_job_ttl_seconds: int = 3600
    top_k_results: int = 5
    embedding_backend: str = "auto"
    embedding_dimensions: int = 256
    max_sessions: int = 20
    offline_model: str = "askmypdf-offline-extractive-v1"
    fast_model: str = "llama-3.1-8b-instant"
    fast_model_provider: str = "groq"
    thinking_model_groq: str = "llama-3.3-70b-versatile"
    thinking_model_anthropic: str = "claude-sonnet-4-6"
    torch_num_threads: int = 2
    port: int = 8000


settings = Settings()
