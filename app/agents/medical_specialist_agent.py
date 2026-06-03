"""
Medical Specialist Agent using Gemini with Google Search grounding.

This agent uses a Gemini model and can invoke Google Search grounding
to search for valid medical knowledge corresponding to questions.
"""

import os
import logging
from typing import Optional, List, Dict
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)


class MedicalSpecialistAgent:
    """
    Medical specialist agent using Gemini + Google Search grounding.

    Uses Gemini model with Google Search tool to answer questions.
    """

    def __init__(
        self,
        model_name: str = "gemini-3.1-flash-lite",
        temperature: float = 0.3,
        verbose: bool = False,
        gemini_api_key: Optional[str] = None,
    ):
        """
        Initialize the medical specialist agent.

        Args:
            model_name: Gemini model to use
            temperature: Model temperature (0.3 for balanced creativity/accuracy)
            verbose: Whether to print debug information
            gemini_api_key: Gemini API key (defaults to env var GEMINI_API_KEY)
        """
        self.model_name = model_name
        self.temperature = temperature
        self.verbose = verbose

        # Initialize Gemini client
        api_key = gemini_api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "Gemini API key not found. Set GEMINI_API_KEY environment variable "
                "or pass gemini_api_key parameter."
            )

        self.gemini_client = genai.Client(api_key=api_key)

        if self.verbose:
            logger.info(
                f"Initialized medical specialist agent with model: {model_name}"
            )

    def query(
        self,
        question: str,
        chat_history: Optional[List] = None,
        context: Optional[str] = None,
    ) -> str:
        """
        Answer a medical question using Gemini + Google Search grounding.

        The model will automatically search for valid medical knowledge
        corresponding to the question.

        Args:
            question: The medical question to answer
            chat_history: Optional conversation history
            context: Optional additional context (e.g., from previous drug interaction query)

        Returns:
            Answer as a string
        """
        try:
            # Prepare system prompt
            system_prompt = """You are a highly experienced medical specialist with expertise in:
- Drug interactions and pharmacology
- Clinical medicine and patient care
- Medication safety and dosing
- Evidence-based medical practice

Your role is to provide accurate, helpful medical information while always emphasizing that:
- Patients should consult healthcare professionals for medical decisions
- Information provided is for educational purposes
- Individual patient factors must be considered
- Medical decisions require professional evaluation

Use your built-in search capabilities to find the most current and accurate medical information.
Search for valid medical knowledge from reliable sources to answer questions accurately.
If you cannot find relevant information, use your medical knowledge but clearly state any limitations.

Always provide clear, understandable explanations suitable for both healthcare professionals and patients."""

            # Build a single grounded prompt for Gemini.
            prompt_parts: List[str] = [system_prompt]

            # Add chat history if available
            if chat_history:
                for msg in chat_history:
                    if isinstance(msg, dict):
                        role = msg.get("role")
                        content = msg.get("content", "")
                        if role in ["user", "assistant", "system"]:
                            prompt_parts.append(f"{role.upper()}: {content}")

            # Build the user message with context
            user_message_parts = []

            if context:
                user_message_parts.append(
                    f"""Additional Context from Previous Query:
{context}

---"""
                )

            user_message_parts.append(f"Question: {question}")

            if context:
                user_message_parts.append(
                    "\nPlease answer the question using the context above if relevant, "
                    "and search for additional medical information as needed."
                )
            else:
                user_message_parts.append(
                    "\nPlease search for valid medical knowledge and provide a comprehensive answer."
                )

            user_message = "\n".join(user_message_parts)
            prompt_parts.append(f"USER: {user_message}")

            prompt = "\n\n".join(prompt_parts)
            completion = self._generate_content(prompt, use_google_search=True)

            answer = completion.text

            if self.verbose:
                logger.info(f"Medical specialist answered question: {question[:50]}...")

            return answer or "I couldn't generate a response."

        except Exception as e:
            error_text = str(e)
            logger.error(f"Error processing medical query: {error_text}")

            if self._is_quota_or_rate_limit_error(error_text):
                return "Gemini is currently rate-limited. Please wait a moment and try again."

            return f"Sorry, this question cannot be processed right now: {error_text}"

    def _generate_content(self, prompt: str, use_google_search: bool):
        """Call Gemini, falling back to a non-grounded call if Google Search quota is exhausted."""
        config_kwargs = {
            "temperature": self.temperature,
            "max_output_tokens": 2000,
        }

        if use_google_search:
            config_kwargs["tools"] = [types.Tool(google_search=types.GoogleSearch())]

        try:
            return self.gemini_client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(**config_kwargs),
            )
        except Exception as e:
            error_text = str(e)
            if use_google_search and self._is_quota_or_rate_limit_error(error_text):
                logger.warning(
                    "Gemini Google Search grounding hit quota/rate limit; retrying without search grounding."
                )
                return self._generate_content(prompt, use_google_search=False)
            raise

    @staticmethod
    def _is_quota_or_rate_limit_error(error_text: str) -> bool:
        normalized = error_text.lower()
        return "resource_exhausted" in normalized or "429" in normalized or "quota" in normalized or "rate limit" in normalized


def create_medical_specialist_agent(
    model_name: str = "gemini-3.1-flash-lite",
    temperature: float = 0.3,
    verbose: bool = False,
    gemini_api_key: Optional[str] = None,
) -> MedicalSpecialistAgent:
    """
    Convenience function to create a medical specialist agent.

    Args:
        model_name: Gemini model to use
        temperature: Model temperature
        verbose: Whether to print debug information
        gemini_api_key: Gemini API key (defaults to env var GEMINI_API_KEY)

    Returns:
        Initialized MedicalSpecialistAgent
    """
    return MedicalSpecialistAgent(
        model_name=model_name,
        temperature=temperature,
        verbose=verbose,
        gemini_api_key=gemini_api_key,
    )
