from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    anthropic_api_key: str
    groq_api_key: str | None = None
    allowed_origins: str = "*"
    allowed_origin_regex: str | None = None
    upload_dir: str = "./data/uploads"
    max_file_size_mb: int = 50
    chunk_size: int = 1200
    chunk_overlap: int = 0
    upload_embedding_batch_size: int = 256
    upload_job_ttl_seconds: int = 3600
    top_k_results: int = 5
    embedding_dimensions: int = 256
    max_sessions: int = 20
    fast_model: str = "llama-3.1-8b-instant"
    fast_model_provider: str = "groq"
    thinking_model: str = "claude-sonnet-4-6"
    thinking_model_provider: str = "anthropic"
    torch_num_threads: int = 2
    port: int = 8000


settings = Settings()
