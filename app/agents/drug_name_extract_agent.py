import base64
import io
import os
from dataclasses import dataclass
from typing import Iterable

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

try:
    import requests
except Exception:
  requests = None

try:
    from PIL import Image
except Exception:
  Image = None

try:
    import numpy as np
    import cv2

    _OCR_RUNTIME_DEPS_AVAILABLE = True
except Exception:
  np = None
  cv2 = None
  _OCR_RUNTIME_DEPS_AVAILABLE = False

try:
  import pytesseract
  from pytesseract import Output as TesseractOutput

  _TESSERACT_AVAILABLE = True
except Exception:
  pytesseract = None
  TesseractOutput = None
  _TESSERACT_AVAILABLE = False

SYSTEM_PROMPT = """
Extract and analyze the active ingredients present in a drug or dietary supplement based on a provided image of its packaging or label.

Carefully review the image to identify text, ingredient lists, supplement facts, or standard labeling used for either medicines or supplements. Focus on locating the section(s) that specifically list active ingredients—including nutrients, vitamins, minerals, botanical extracts, or other bioactive compounds—as well as their strength, dosage, or daily value, and any related details. Examine the context and formatting cues to distinguish active ingredients from inactive components, excipients, or other product information.

Always perform explicit reasoning and deduction first. Call out the evidence/basis in the image for each decision before listing conclusions or classifying content. Do not provide a summary of the active ingredients until after you have detailed your step-by-step analysis.

If information is partially obscured or unclear, label such fields as [unclear]. If no active ingredient(s) are visible, explicitly state that.

## Step-by-step instructions:
1. Carefully scan all text regions in the image.
2. Identify and list all possible ingredient candidates from the identified text.
3. For each candidate, reason through why it should (or should not) be considered an active ingredient:
    - Refer to typical drug or supplement labeling structures, such as "Active Ingredient(s)", "Supplement Facts", "Nutrition Facts", "Contains", or corresponding sections and their placement.
    - For supplements, recognize nutrients (e.g., vitamins, minerals, amino acids), plant or herbal extracts, or other constituents that are known to have physiological effects, as described by the label.
    - If the supplement name itself (e.g., "Vitamin C tablets", "Magnesium capsules", "Ginseng supplement", etc.) directly indicates the likely active ingredient, infer and extract this information even if an explicit ingredient list is missing or unclear. Use your knowledge of common supplement naming conventions to deduce the probable active ingredient(s) when they are implied by the product name.
    - Check for dosage or content indications (e.g., "500 mg Vitamin C", "Zinc 30 mg", "Probiotic blend 10 Billion CFU").
    - Eliminate excipients, inactive/other ingredients, fillers, capsule materials, or substances explicitly labeled as such.
    - If the language is non-English, attempt translation for ingredient names.
4. After reasoning, clearly list the active ingredient(s) and provide any relevant strength/dosage information, if present.
5. If more than one active ingredient is found, enumerate all.

## Output Format:
Return a JSON object with the following structure:
{
  "reasoning_steps": [
    "Step-by-step explanation of how you identified or discounted each active ingredient, referencing image evidence."
  ],
  "active_ingredients": [
    {
      "name": "[ingredient name]",
      "strength": "[dosage/strength if available, e.g., '500 mg' or [unclear]]"
    },
    ...
  ]
}

If no clear active ingredient can be found, set "active_ingredients" to an empty array and explain in "reasoning_steps".

## Example

### Example 1:
**Input image**: (packaging states "Paracetamol 500mg Tablets, Each tablet contains: Paracetamol 500mg. Also contains: starch, magnesium stearate, sodium starch glycolate.")

**Output:**
{
  "reasoning_steps": [
    "Located the section labeled 'Active Ingredient' with 'Paracetamol 500mg.'",
    "Other substances ('starch', 'magnesium stearate', 'sodium starch glycolate') are listed separately as non-active excipients.",
    "Dosage '500mg' is explicitly associated with Paracetamol."
  ],
  "active_ingredients": [
    {
      "name": "Paracetamol",
      "strength": "500 mg"
    }
  ]
}

### Example 2:
**Input image**: (vial with label shows: 'Ibuprofen 400mg/5ml oral suspension. Inactive ingredients: sucrose, sodium, etc.')

**Output:**
{
  "reasoning_steps": [
    "The label shows 'Ibuprofen 400mg/5ml,' indicating the concentration.",
    "A separate list specifies inactive ingredients, so these are disregarded."
  ],
  "active_ingredients": [
    {
      "name": "Ibuprofen",
      "strength": "400 mg/5 ml"
    }
  ]
}

### Example 3:
**Input image**: (low-resolution, main ingredient line partially obscured)

**Output:**
{
  "reasoning_steps": [
    "The label appears to show an active ingredient line, but most characters are obscured.",
    "Cannot confidently identify the ingredient or strength."
  ],
  "active_ingredients": []
}

### Example 4:
**Input image**: (label shows: 'GH Creation EX')

**Output:**
{
  "reasoning_steps": [
    "The label prominently displays 'GH Creation EX+' and molecular diagrams of α-GPC (Alpha-Glyceryl Phosphoryl Choline) with calcium ions (Ca2+).",
    "No explicit 'ingredient list' section is visible, but 'GH Creation' is known as a supplement emphasizing α-GPC as its primary active component supporting growth hormone release.",
    "Supporting compounds such as L-Arginine, L-Ornithine, and L-Lysine are typical cofactors, but α-GPC is the defining active ingredient."
  ],
  "active_ingredients": [
    {
      "name": "Alpha-Glyceryl Phosphoryl Choline (α-GPC)",
      "strength": "[unclear]",
      "evidence": "Molecular structure shown on label and known formulation of GH Creation EX+."
    }
  ]
}


## Important Reminders (repeat for longer prompts)
- Always analyze and explain reasoning steps before presenting conclusions.
- If information is missing or unclear, label as [unclear] in results.
- Only list as active ingredients those explicitly listed as such, or with clear supporting evidence.
- Always output results in the specified JSON format.
"""

TEXT_PARSER_PROMPT = """
You are given OCR text extracted from medicine packaging.
Your task is to identify ACTIVE INGREDIENTS only and normalize output.

Rules:
1. Prioritize sections like: Active Ingredient(s), Supplement Facts, Ingredients, Thanh phan, Hoat chat.
2. Exclude inactive ingredients/excipients/fillers unless the package clearly indicates they are active.
3. Normalize ingredient names to common generic names when possible.
4. Keep strength in original unit if available (mg, mcg, g, IU, %, mg/5ml, etc.).
5. If strength is not clear, set it to [unclear].
6. Return strict JSON with reasoning_steps and active_ingredients.
"""


OCR_KEYWORDS = (
  "active ingredient",
  "active ingredients",
  "supplement facts",
  "ingredients",
  "thanh phan",
  "hoat chat",
  "ham luong",
  "mg",
  "mcg",
  "iu",
)


@dataclass
class OCRExtractionResult:
  text: str
  confidence: float
  has_keywords: bool


class DrugNameExtractAgent:
    """
    Agent for extracting drug names and active ingredients from images of drug packaging or labels.
    Uses vision-capable LLM to analyze images directly.
    """

    def __init__(
        self,
        model_name: str | None = None,
        verbose: bool = False,
        gemini_api_key: str | None = None,
    ):
        """
        Initialize the drug name extract agent.

        Args:
            model_name: The name of the vision-capable model to use.
            verbose: Whether to print verbose output.
            gemini_api_key: API key for Gemini. Defaults to GEMINI_API_KEY env var.
        """
        selected_model = model_name or os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
        api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing. Please set it in your environment.")

        self.llm = ChatGoogleGenerativeAI(
            model=selected_model,
            temperature=0.3,
            google_api_key=api_key,
        )
        self.llm_with_structured_output = self.llm.with_structured_output(LLMResponse)
        self.verbose = verbose
        self.last_extraction_meta: dict = {
            "processing_source": "unknown",
            "ocr_confidence": None,
            "ocr_has_keywords": None,
        }

    def extract_drug_names_from_image(self, image_url: str) -> list[str]:
        """
        Extract drug names from an image of drug packaging or label.

        Args:
            image_url: URL or base64-encoded image of the drug packaging/label

        Returns:
            JSON string containing reasoning steps and extracted active ingredients
        """

        ocr_result: OCRExtractionResult | None = None
        ocr_structured: LLMResponse | None = None
        self.last_extraction_meta = {
            "processing_source": "vision_only",
            "ocr_confidence": None,
            "ocr_has_keywords": None,
        }

        # Step 1-2: OCR path with preprocessing and confidence scoring.
        if _OCR_RUNTIME_DEPS_AVAILABLE and _TESSERACT_AVAILABLE:
            try:
                ocr_result = self._extract_text_with_ocr(image_url)
                self.last_extraction_meta["ocr_confidence"] = round(ocr_result.confidence, 2)
                self.last_extraction_meta["ocr_has_keywords"] = ocr_result.has_keywords
                if self.verbose:
                    print(
                        f"OCR confidence={ocr_result.confidence:.1f}, has_keywords={ocr_result.has_keywords}"
                    )
            except Exception as e:
                if self.verbose:
                    print(f"OCR failed, using vision fallback: {e}")
                self.last_extraction_meta["processing_source"] = "vision_fallback_ocr_error"
        elif self.verbose:
            print("OCR dependencies are not available. Using vision LLM path.")
            self.last_extraction_meta["processing_source"] = "vision_no_ocr_runtime"

        # Step 3: If OCR signal is strong, parse OCR text with text-only LLM first.
        if ocr_result and self._should_use_ocr_path(ocr_result):
            ocr_structured = self._extract_from_text_with_llm(ocr_result.text)
            if self._is_structured_result_strong(ocr_structured):
                self.last_extraction_meta["processing_source"] = "ocr_text_llm"
                return [item.name for item in ocr_structured.active_ingredients]

        # Step 4: OCR weak/incomplete/conflicting -> vision LLM.
        vision_structured = self._extract_from_image_with_vision(image_url)

        if ocr_structured:
            merged = self._merge_results(ocr_structured, vision_structured)
            self.last_extraction_meta["processing_source"] = "merged_ocr_vision"
            return [item.name for item in merged.active_ingredients]

        self.last_extraction_meta["processing_source"] = "vision_only"
        return [item.name for item in vision_structured.active_ingredients]

    def get_last_extraction_meta(self) -> dict:
        return self.last_extraction_meta

    def _extract_from_image_with_vision(self, image_url: str) -> "LLMResponse":
        image_data_url = self._to_data_url(image_url)
        messages = [
            HumanMessage(
                content=[
                    {"type": "text", "text": SYSTEM_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ]
            )
        ]

        try:
            return self._invoke_structured(messages)
        except Exception as first_error:
            # Fallback for providers/adapters that expect image_url as plain string.
            fallback_messages = [
                HumanMessage(
                    content=[
                        {"type": "text", "text": SYSTEM_PROMPT},
                        {"type": "image_url", "image_url": image_data_url},
                    ]
                )
            ]
            try:
                return self._invoke_structured(fallback_messages)
            except Exception:
                raise first_error

    def _to_data_url(self, image_url: str) -> str:
        """Normalize any image source (URL/path/base64) into a data URL for Gemini vision."""
        if image_url.startswith("data:image"):
            return image_url

        image = self._load_image(image_url)

        # Keep payload small to avoid Gemini 400 errors from oversized image input.
        max_side = 1600
        width, height = image.size
        longest = max(width, height)
        if longest > max_side:
            scale = max_side / float(longest)
            new_size = (int(width * scale), int(height * scale))
            image = image.resize(new_size)

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85, optimize=True)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{encoded}"

    def _extract_from_text_with_llm(self, ocr_text: str) -> "LLMResponse":
        messages = [
            SystemMessage(content=TEXT_PARSER_PROMPT),
            HumanMessage(content=f"OCR text:\n{ocr_text}"),
        ]
        return self._invoke_structured(messages)

    def _invoke_structured(self, messages: list[HumanMessage | SystemMessage]) -> "LLMResponse":
        try:
            return self.llm_with_structured_output.invoke(messages)
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "Unauthorized" in error_msg:
                raise RuntimeError(
                    "LLM authentication failed. Check GEMINI_API_KEY configuration."
                ) from e
            if "400" in error_msg or "Bad Request" in error_msg or "InvalidArgument" in error_msg:
                raise RuntimeError(
                    f"Gemini request invalid (400). Details: {error_msg}"
                ) from e
            raise

    def _extract_text_with_ocr(self, image_url: str) -> OCRExtractionResult:
        image = self._load_image(image_url)
        preprocessed = self._preprocess_for_ocr(image)

        ocr_data = pytesseract.image_to_data(
            preprocessed,
            output_type=TesseractOutput.DICT,
            config="--oem 3 --psm 6",
        )

        tokens: list[str] = []
        confidences: list[float] = []
        for token, conf in zip(ocr_data.get("text", []), ocr_data.get("conf", [])):
            cleaned = (token or "").strip()
            if not cleaned:
                continue
            tokens.append(cleaned)
            try:
                conf_val = float(conf)
                if conf_val >= 0:
                    confidences.append(conf_val)
            except (TypeError, ValueError):
                continue

        text = " ".join(tokens).strip()
        if not text:
            # Last resort if tokenized data is too sparse.
            text = pytesseract.image_to_string(preprocessed, config="--oem 3 --psm 6").strip()

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        return OCRExtractionResult(
            text=text,
            confidence=avg_conf,
            has_keywords=self._contains_ocr_keywords(text),
        )

    def _load_image(self, image_url: str):
        if Image is None:
            raise RuntimeError("Pillow is required for image processing. Please install pillow.")

        if image_url.startswith("data:image"):
            _, encoded = image_url.split(",", 1)
            raw = base64.b64decode(encoded)
        elif image_url.startswith("http://") or image_url.startswith("https://"):
            if requests is None:
                raise RuntimeError("requests is required to load remote images. Please install requests.")
            response = requests.get(
                image_url,
                timeout=20,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                },
            )
            response.raise_for_status()
            raw = response.content
        else:
            with open(image_url, "rb") as f:
                raw = f.read()

        return Image.open(io.BytesIO(raw)).convert("RGB")

    def _preprocess_for_ocr(self, image):
        rgb = np.array(image)
        h, w = rgb.shape[:2]

        # Resize for better OCR signal on small labels.
        min_width = 1400
        if w < min_width:
            scale = min_width / float(w)
            rgb = cv2.resize(
                rgb,
                (int(w * scale), int(h * scale)),
                interpolation=cv2.INTER_CUBIC,
            )

        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

        # Contrast enhancement and denoising.
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        gray = cv2.bilateralFilter(gray, 7, 50, 50)

        # Binarize then deskew lightly.
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return self._deskew_binary(binary)

    def _deskew_binary(self, binary):
        coords = np.column_stack(np.where(binary < 128))
        if coords.size < 100:
            return binary

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) < 0.5:
            return binary

        h, w = binary.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(
            binary,
            matrix,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )

    def _contains_ocr_keywords(self, text: str) -> bool:
        lowered = text.lower()
        return any(keyword in lowered for keyword in OCR_KEYWORDS)

    def _should_use_ocr_path(self, ocr_result: OCRExtractionResult) -> bool:
        if not ocr_result.text or len(ocr_result.text) < 25:
            return False
        return ocr_result.confidence >= 45.0 and ocr_result.has_keywords

    def _is_structured_result_strong(self, result: "LLMResponse") -> bool:
        if not result.active_ingredients:
            return False
        # Consider weak if every item has unclear strength.
        strengths = [item.strength.lower() for item in result.active_ingredients if item.strength]
        return any("unclear" not in strength for strength in strengths) or len(result.active_ingredients) >= 2

    def _merge_results(self, ocr_result: "LLMResponse", vision_result: "LLMResponse") -> "LLMResponse":
        merged_steps = [
            *ocr_result.reasoning_steps,
            "Merged OCR-text parsing with vision parsing for final consistency.",
            *vision_result.reasoning_steps,
        ]

        merged_ingredients: list[ActiveIngredient] = []
        seen: set[str] = set()
        for item in self._iter_ingredients(ocr_result.active_ingredients, vision_result.active_ingredients):
            key = item.name.strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            merged_ingredients.append(item)

        return LLMResponse(reasoning_steps=merged_steps, active_ingredients=merged_ingredients)

    def _iter_ingredients(self, *groups: Iterable["ActiveIngredient"]):
        for group in groups:
            for item in group:
                yield item


class ActiveIngredient(BaseModel):
    """Active ingredient model."""

    name: str = Field(..., description="Name of the active ingredient")
    strength: str = Field(..., description="Strength of the active ingredient")


class LLMResponse(BaseModel):
    """Response model for drug name extraction from image."""

    reasoning_steps: list[str] = Field(..., description="Reasoning steps")
    active_ingredients: list[ActiveIngredient] = Field(
        ..., description="Active ingredients"
    )


if __name__ == "__main__":
    agent = DrugNameExtractAgent(verbose=True)
    # Example with a sample image URL
    # Replace with actual image URL or base64 encoded image
    sample_image_url = "https://example.com/drug-package.jpg"
    result = agent.extract_drug_names_from_image(sample_image_url)
    print(result)
