import pytest

from app.services.ai_service import AIService


@pytest.fixture()
def service() -> AIService:
    return AIService(db=None)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("我家套内 98 平，预算 18 万，想做标准装修", "budget"),
        ("厨房防水做完后闭水试验多久合适", "coach"),
        ("现代简约和奶油风哪个更适合小户型", "freeqa"),
        ("先帮我大概估个装修费用", "budget"),
        ("我家厨房想做个好一点的灶台，大概要花多少钱", "budget"),
    ],
)
def test_classify_intent(service: AIService, message: str, expected: str) -> None:
    assert service._classify_intent(message) == expected


def test_resolve_session_type_prefers_explicit_type(service: AIService) -> None:
    resolved = service._resolve_session_type(
        requested_type="coach",
        message="我想知道预算",
        previous_type="budget",
    )
    assert resolved == "coach"


def test_resolve_session_type_keeps_previous_type(service: AIService) -> None:
    resolved = service._resolve_session_type(
        requested_type="auto",
        message="这条消息看起来像预算提问",
        previous_type="freeqa",
    )
    assert resolved == "freeqa"


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("", 0),
        ("abc", 1),
        ("装修预算", 6),
        ("装修 budget 2026", 6),
    ],
)
def test_estimate_tokens(service: AIService, text: str, expected: int) -> None:
    assert service._estimate_tokens(text) == expected
