import base64
import logging
import random
from typing import Any

import httpx
from fastapi import UploadFile

from app.config import settings
from app.schemas.design import DesignGenerateResponse
from app.services.upload_service import save_upload_bytes
from app.utils.exceptions import BadRequestError

logger = logging.getLogger(__name__)

MOCK_STYLE_IMAGES = {
    "现代简约": "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=80",
    "北欧": "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1400&q=80",
    "日式": "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1400&q=80",
    "轻奢": "https://images.unsplash.com/photo-1616594039964-8db67f4f62f5?auto=format&fit=crop&w=1400&q=80",
    "新中式": "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&w=1400&q=80",
}

DEFAULT_MOCK_IMAGE = "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1400&q=80"
SUPPORTED_CONTROL_MODES = {"none", "canny", "depth", "mlsd"}


class DesignImageService:
    """
    Design image generation service.
    Providers:
    - mock
    - stability (text-to-image fallback)
    - stability_control (image-conditioned route if endpoint configured)
    - vertical (custom vendor endpoint)
    """

    def __init__(self, db: Any = None):
        self.db = db

    async def generate_room_design(
        self,
        room_photo: UploadFile,
        style: str,
        room_type: str,
        preferences: dict[str, Any] | None = None,
        control_mode: str = "none",
        strength: float = 0.7,
        seed: int | None = None,
    ) -> DesignGenerateResponse:
        photo_bytes = await room_photo.read()
        if not photo_bytes:
            raise BadRequestError("请上传清晰的房间照片")

        source_url = save_upload_bytes(photo_bytes, room_photo.filename)
        normalized_style = (style or "").strip() or "现代简约"
        normalized_room_type = (room_type or "").strip() or "living"
        normalized_preferences = preferences or {}
        normalized_control_mode = self._normalize_control_mode(control_mode)
        normalized_strength = self._normalize_strength(strength)
        normalized_seed = seed if seed is not None else random.randint(1, 2_000_000_000)
        prompt = self._build_prompt(
            normalized_style,
            normalized_room_type,
            normalized_preferences,
            normalized_control_mode,
        )

        provider = (settings.DESIGN_PROVIDER or "mock").strip().lower()
        generated_url: str | None = None
        provider_used = provider

        if provider in {"stability", "stability_core"} and settings.STABILITY_API_KEY:
            generated_url = await self._generate_with_stability_core(
                prompt=prompt,
                seed=normalized_seed,
            )
            provider_used = "stability"
        elif provider in {"stability_control", "stability_img2img"} and settings.STABILITY_API_KEY:
            generated_url = await self._generate_with_stability_structure(
                source_image=photo_bytes,
                prompt=prompt,
                control_mode=normalized_control_mode,
                strength=normalized_strength,
                seed=normalized_seed,
            )
            provider_used = "stability_control"
        elif provider == "vertical" and settings.DESIGN_VERTICAL_PROVIDER_URL:
            generated_url = await self._generate_with_vertical_provider(
                source_image=photo_bytes,
                prompt=prompt,
                style=normalized_style,
                room_type=normalized_room_type,
                preferences=normalized_preferences,
                control_mode=normalized_control_mode,
                strength=normalized_strength,
                seed=normalized_seed,
            )
            provider_used = "vertical"

        if generated_url:
            return DesignGenerateResponse(
                source_image_url=source_url,
                generated_image_url=generated_url,
                style=normalized_style,
                room_type=normalized_room_type,
                provider=provider_used,
                is_mock=False,
                prompt=prompt,
                preferences=normalized_preferences,
                control_mode=normalized_control_mode,
                strength=normalized_strength,
                seed=normalized_seed,
            )

        if provider != "mock":
            logger.warning("Design provider %s failed, fallback to mock", provider)

        return DesignGenerateResponse(
            source_image_url=source_url,
            generated_image_url=self._pick_mock_image(normalized_style),
            style=normalized_style,
            room_type=normalized_room_type,
            provider="mock",
            is_mock=True,
            note="当前为演示版效果图（Mock），可在配置中切换到真实生成服务。",
            prompt=prompt,
            preferences=normalized_preferences,
            control_mode=normalized_control_mode,
            strength=normalized_strength,
            seed=normalized_seed,
        )

    async def _generate_with_stability_core(self, prompt: str, seed: int | None = None) -> str | None:
        endpoint = f"{settings.STABILITY_API_BASE.rstrip('/')}/v2beta/stable-image/generate/core"
        headers = {
            "Authorization": f"Bearer {settings.STABILITY_API_KEY}",
            "Accept": "image/*",
        }
        data = {
            "prompt": prompt,
            "output_format": "jpeg",
        }
        if seed is not None:
            data["seed"] = str(seed)

        try:
            async with httpx.AsyncClient(timeout=90) as client:
                response = await client.post(endpoint, headers=headers, data=data)
            return self._handle_image_response(response, "stability_core.jpg")
        except Exception as exc:
            logger.warning("Stability core request failed: %s", exc)
            return None

    async def _generate_with_stability_structure(
        self,
        source_image: bytes,
        prompt: str,
        control_mode: str,
        strength: float,
        seed: int | None = None,
    ) -> str | None:
        endpoint = (
            settings.STABILITY_IMAGE_TO_IMAGE_ENDPOINT.strip()
            or f"{settings.STABILITY_API_BASE.rstrip('/')}/v2beta/stable-image/generate/core"
        )
        headers = {
            "Authorization": f"Bearer {settings.STABILITY_API_KEY}",
            "Accept": "image/*",
        }
        files = {
            "image": ("source.jpg", source_image, "image/jpeg"),
        }
        data = {
            "prompt": prompt,
            "output_format": "jpeg",
            "control_mode": control_mode,
            "strength": str(strength),
        }
        if seed is not None:
            data["seed"] = str(seed)

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(endpoint, headers=headers, files=files, data=data)
            return self._handle_image_response(response, "stability_control.jpg")
        except Exception as exc:
            logger.warning("Stability structure request failed: %s", exc)
            return None

    async def _generate_with_vertical_provider(
        self,
        source_image: bytes,
        prompt: str,
        style: str,
        room_type: str,
        preferences: dict[str, Any],
        control_mode: str,
        strength: float,
        seed: int | None = None,
    ) -> str | None:
        endpoint = settings.DESIGN_VERTICAL_PROVIDER_URL.strip()
        headers = {"Content-Type": "application/json"}
        if settings.DESIGN_VERTICAL_PROVIDER_KEY:
            headers["Authorization"] = f"Bearer {settings.DESIGN_VERTICAL_PROVIDER_KEY}"
        payload: dict[str, Any] = {
            "image_base64": base64.b64encode(source_image).decode("utf-8"),
            "prompt": prompt,
            "style": style,
            "room_type": room_type,
            "preferences": preferences,
            "control_mode": control_mode,
            "strength": strength,
        }
        if seed is not None:
            payload["seed"] = seed

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
            if response.status_code >= 400:
                logger.warning(
                    "Vertical provider returned %s: %s",
                    response.status_code,
                    response.text[:300],
                )
                return None
            data = response.json()
            if isinstance(data, dict):
                image_url = data.get("image_url") or data.get("url")
                if isinstance(image_url, str) and image_url:
                    return image_url
                image_b64 = data.get("image_base64")
                if isinstance(image_b64, str) and image_b64:
                    decoded = base64.b64decode(image_b64)
                    return save_upload_bytes(decoded, "vertical_generated.jpg")
            return None
        except Exception as exc:
            logger.warning("Vertical provider request failed: %s", exc)
            return None

    def _handle_image_response(self, response: httpx.Response, filename: str) -> str | None:
        if response.status_code >= 400:
            logger.warning(
                "Image provider returned %s: %s",
                response.status_code,
                response.text[:300],
            )
            return None

        content_type = (response.headers.get("content-type") or "").lower()
        if content_type.startswith("image/"):
            return save_upload_bytes(response.content, filename)

        try:
            payload = response.json()
        except Exception:
            return None

        if not isinstance(payload, dict):
            return None

        url = payload.get("image_url") or payload.get("url")
        if isinstance(url, str) and url:
            return url

        image_b64 = payload.get("image") or payload.get("image_base64")
        if isinstance(image_b64, str) and image_b64:
            try:
                decoded = base64.b64decode(image_b64)
                return save_upload_bytes(decoded, filename)
            except Exception:
                return None
        return None

    def _build_prompt(
        self,
        style: str,
        room_type: str,
        preferences: dict[str, Any],
        control_mode: str,
    ) -> str:
        tone = str(preferences.get("tone") or "").strip()
        material = str(preferences.get("material") or "").strip()
        lighting = str(preferences.get("lighting") or "").strip()
        budget = str(preferences.get("budget") or "").strip()

        preference_lines = [item for item in [tone, material, lighting] if item]
        preference_text = ", ".join(preference_lines) if preference_lines else "balanced lighting, practical layout"
        budget_text = f", budget target {budget}" if budget else ""
        structure_hint = "strictly keep room geometry from source image" if control_mode != "none" else "realistic room proportion"

        return (
            f"interior design render, {style} style, {room_type} room, "
            f"high quality, realistic materials, {preference_text}{budget_text}, "
            f"{structure_hint}"
        )

    def _pick_mock_image(self, style: str) -> str:
        for key, image_url in MOCK_STYLE_IMAGES.items():
            if key in style:
                return image_url
        return DEFAULT_MOCK_IMAGE

    def _normalize_control_mode(self, control_mode: str) -> str:
        mode = (control_mode or "none").strip().lower()
        if mode not in SUPPORTED_CONTROL_MODES:
            return "none"
        return mode

    def _normalize_strength(self, strength: float) -> float:
        value = float(strength or 0.7)
        if value < 0.1:
            return 0.1
        if value > 1.0:
            return 1.0
        return round(value, 2)
