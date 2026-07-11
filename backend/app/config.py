"""
Centralized application settings.

All configuration is sourced from environment variables (see .env.example).
No secret ever has a hardcoded default here — only non-sensitive defaults
(timeouts, model IDs, ports) are allowed to have fallback values.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Server ---
    app_env: str = "development"
    log_level: str = "INFO"
    allowed_origins: str = "http://localhost:3000"

    # --- watsonx.ai ---
    watsonx_api_key: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_project_id: str = ""
    watsonx_text_model_id: str = "ibm/granite-4-h-small"
    watsonx_vision_model_id: str = "ibm/granite-vision-3-2-2b"

    # --- Cloudant ---
    cloudant_url: str = ""
    cloudant_apikey: str = ""
    cloudant_db_name: str = "sketch2tikz_projects"

    # --- IBM Cloud Object Storage ---
    cos_api_key: str = ""
    cos_instance_crn: str = ""
    cos_endpoint: str = "https://s3.us-south.cloud-object-storage.appdomain.cloud"
    cos_bucket: str = "sketch2tikz-assets"

    # --- LaTeX compiler ---
    latex_engine: str = "pdflatex"
    compile_timeout_seconds: int = 25
    autofix_max_attempts: int = 2

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_watsonx_configured(self) -> bool:
        return bool(self.watsonx_api_key and self.watsonx_project_id)

    @property
    def is_cloudant_configured(self) -> bool:
        return bool(self.cloudant_url and self.cloudant_apikey)

    @property
    def is_cos_configured(self) -> bool:
        return bool(self.cos_api_key and self.cos_instance_crn)


@lru_cache
def get_settings() -> Settings:
    """Settings are cached — env vars are read once per process lifetime."""
    return Settings()
