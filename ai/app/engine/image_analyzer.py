from __future__ import annotations

import base64
import json
import re
from io import BytesIO
from typing import Any

import httpx
from anthropic import Anthropic
from openai import OpenAI
from PIL import Image

from app.config import Settings, get_settings
from app.engine.prompt_templates import IMAGE_ANALYSIS_PROMPT
from app.models.triage import ImageAnalysis


class ImageAnalyzer:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def analyze_image(self, image_url: str, context: str) -> ImageAnalysis:
        mime_type, encoded_image = self._fetch_image(image_url)
        prompt = f"{IMAGE_ANALYSIS_PROMPT}\nContext: {context}"
        if self.settings.llm_provider == "anthropic":
            if not self.settings.anthropic_api_key:
                raise RuntimeError("ANTHROPIC_API_KEY is not configured.")
            payload = self._anthropic_image_request(prompt, mime_type, encoded_image)
        else:
            if not self.settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not configured.")
            payload = self._openai_image_request(prompt, mime_type, encoded_image)
        return self._build_image_analysis(payload)

    def _fetch_image(self, image_url: str) -> tuple[str, str]:
        with httpx.Client(timeout=self.settings.request_timeout_seconds, follow_redirects=True) as client:
            response = client.get(image_url)
            response.raise_for_status()
        image_bytes = response.content
        with Image.open(BytesIO(image_bytes)) as image:
            mime_type = Image.MIME.get(image.format or "JPEG", response.headers.get("content-type", "image/jpeg").split(";")[0])
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        return mime_type, encoded_image

    def _openai_image_request(self, prompt: str, mime_type: str, encoded_image: str) -> dict[str, Any]:
        data_url = f"data:{mime_type};base64,{encoded_image}"
        client = OpenAI(api_key=self.settings.openai_api_key, timeout=self.settings.request_timeout_seconds)
        response = client.chat.completions.create(
            model=self.settings.vision_model_name,
            temperature=0.1,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this patient image conservatively and return JSON only."},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
        )
        content = response.choices[0].message.content or "{}"
        return self._extract_json(content)

    def _anthropic_image_request(self, prompt: str, mime_type: str, encoded_image: str) -> dict[str, Any]:
        client = Anthropic(api_key=self.settings.anthropic_api_key, timeout=self.settings.request_timeout_seconds)
        response = client.messages.create(
            model=self.settings.vision_model_name,
            max_tokens=800,
            temperature=0,
            system=prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this patient image conservatively and return JSON only."},
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": mime_type, "data": encoded_image},
                        },
                    ],
                }
            ],
        )
        content = "\n".join(block.text for block in response.content if getattr(block, "type", None) == "text")
        return self._extract_json(content)

    def _build_image_analysis(self, payload: dict[str, Any]) -> ImageAnalysis:
        if not payload:
            return ImageAnalysis(summary="Image review unavailable.", quality_issues=["Model returned an empty response."])
        return ImageAnalysis(
            observations=list(payload.get("observations") or []),
            concerning_features=list(payload.get("concerning_features") or []),
            quality_issues=list(payload.get("quality_issues") or []),
            summary=str(payload.get("summary") or "Image reviewed for observable findings only."),
        )

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any]:
        stripped = content.strip()
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", stripped, re.DOTALL)
            if not match:
                return {}
            return json.loads(match.group(0))
