"""Response models for API endpoints."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QueryResponse(BaseModel):
    """Response model for query."""

    answer: str = Field(..., description="Agent's response to the query")
    drug_links: dict = Field(..., description="Drug links from drugs.com")
    parsed_result: dict = Field(..., description="Parsed result from the query")


class ChatResponse(BaseModel):
    """Response model for chat."""

    answer: str = Field(..., description="Agent's response to the query")
    session_id: str = Field(..., description="Session ID for this conversation")
    timestamp: str = Field(..., description="ISO timestamp of the response")


class StatsResponse(BaseModel):
    """Response model for statistics."""

    total_drugs: int = Field(..., description="Total number of drugs in the database")
    total_interactions: int = Field(
        ..., description="Total number of drug interactions"
    )
    active_sessions: int = Field(..., description="Number of active chat sessions")


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str = Field(..., description="API status")
    agent_loaded: bool = Field(..., description="Whether the agent is loaded")
    timestamp: str = Field(..., description="ISO timestamp")


class ErrorResponse(BaseModel):
    """Response model for errors."""

    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")


class DrugNamesFromImageResponse(BaseModel):
    """Response model for drug name extraction from image."""

    result: list[str] = Field(..., description="List of drug names")
    timestamp: str = Field(..., description="ISO timestamp of the response")
    processing_source: Optional[str] = Field(
        None,
        description="Extraction branch used: ocr_text_llm, merged_ocr_vision, vision_only, etc.",
    )
    ocr_confidence: Optional[float] = Field(
        None,
        description="Average OCR confidence (0-100) when OCR step ran",
    )
    ocr_has_keywords: Optional[bool] = Field(
        None,
        description="Whether OCR text contains ingredient-related keywords",
    )


class DrugInteractionInfo(BaseModel):
    """Model for drug interaction information."""

    drug1: str = Field(..., description="First drug name")
    drug2: str = Field(..., description="Second drug name")
    interaction: Optional[str] = Field(None, description="Interaction details")
    has_interaction: bool = Field(..., description="Whether interaction exists")
    severity: Optional[str] = Field(None, description="Severity level if available")
    checked_at: str = Field(..., description="ISO timestamp when checked")


class AddDrugResponse(BaseModel):
    """Response model for adding a drug."""

    success: bool = Field(..., description="Whether drug was added successfully")
    message: str = Field(..., description="Status message")
    drug_name: str = Field(..., description="Name of the drug added")
    user_id: str = Field(..., description="User identifier")
    checking_interactions: bool = Field(
        ..., description="Whether interaction check is running in background"
    )
    timestamp: str = Field(..., description="ISO timestamp")


class DrugWithInteractions(BaseModel):
    """Model for drug with its interactions."""

    drug_name: str = Field(..., description="Drug name")
    interactions: Optional[str] = Field(
        None, description="Joined string of all interactions (if multiple, joined)"
    )


class MedicineCabinetListResponse(BaseModel):
    """Response model for listing medicine cabinet."""

    user_id: str = Field(..., description="User identifier")
    drugs: List[DrugWithInteractions] = Field(
        ..., description="List of drugs with their interactions"
    )
    count: int = Field(..., description="Number of drugs in cabinet")
    stats: Optional[Dict[str, Any]] = Field(
        None, description="Derived cabinet and check-history stats"
    )
    timestamp: str = Field(..., description="ISO timestamp")


class DrugInteractionsResponse(BaseModel):
    """Response model for drug interactions check."""

    drug_name: str = Field(..., description="Drug name checked")
    user_id: str = Field(..., description="User identifier")
    interactions: List[DrugInteractionInfo] = Field(
        ..., description="List of interactions found"
    )
    total_interactions: int = Field(..., description="Total number of interactions")
    timestamp: str = Field(..., description="ISO timestamp")


class MostCheckedDrugInfo(BaseModel):
    """Model for frequently checked drugs."""

    drug_name: str = Field(..., description="Drug name")
    count: int = Field(..., description="Number of times this drug was checked")


class MedicineCabinetStats(BaseModel):
    """Derived stats for a user's medicine cabinet and check history."""

    total_saved_drugs: int = Field(..., description="Number of saved cabinet drugs")
    total_checks: int = Field(..., description="Number of saved interaction checks")
    total_interaction_alerts: int = Field(
        ..., description="Total interaction alerts across saved checks"
    )
    high_risk_checks: int = Field(..., description="Number of checks with elevated risk")
    last_checked_at: Optional[str] = Field(
        None, description="ISO timestamp of the latest saved check"
    )
    most_checked_drugs: List[MostCheckedDrugInfo] = Field(
        default_factory=list,
        description="Most frequently checked drugs",
    )


class InteractionPairRecord(BaseModel):
    """Model for one drug pair within a saved interaction check."""

    drug1: str = Field(..., description="First drug name")
    drug2: str = Field(..., description="Second drug name")
    status: str = Field(..., description="Interaction status")
    details: str = Field(..., description="Interaction details")
    has_interaction: bool = Field(..., description="Whether interaction exists")
    severity: str = Field(..., description="Derived severity level")


class InteractionCheckRecordResponse(BaseModel):
    """Response model for one saved interaction check."""

    id: str = Field(..., description="Interaction check record identifier")
    user_id: str = Field(..., description="User identifier")
    checked_drugs: List[str] = Field(..., description="Drugs included in the check")
    result_summary: Optional[str] = Field(None, description="Saved result summary")
    overall_risk: str = Field(..., description="Overall risk label")
    total_pairs: int = Field(..., description="Number of checked drug pairs")
    interactions_found: int = Field(..., description="Number of interaction alerts")
    interaction_pairs: List[InteractionPairRecord] = Field(
        default_factory=list,
        description="Saved interaction pair details",
    )
    result: Any = Field(None, description="Original interaction response payload")
    source: str = Field(..., description="Where the check came from")
    checked_at: str = Field(..., description="ISO timestamp when checked")


class SaveInteractionCheckResponse(BaseModel):
    """Response model for saving an interaction check."""

    success: bool = Field(..., description="Whether the check was saved successfully")
    message: str = Field(..., description="Status message")
    record: InteractionCheckRecordResponse = Field(
        ..., description="Saved interaction check"
    )
    stats: MedicineCabinetStats = Field(..., description="Updated cabinet stats")
    timestamp: str = Field(..., description="ISO timestamp")


class InteractionCheckHistoryResponse(BaseModel):
    """Response model for listing saved interaction checks."""

    user_id: str = Field(..., description="User identifier")
    history: List[InteractionCheckRecordResponse] = Field(
        default_factory=list,
        description="Recent saved interaction checks",
    )
    stats: MedicineCabinetStats = Field(..., description="Derived cabinet stats")
    count: int = Field(..., description="Number of returned history records")
    timestamp: str = Field(..., description="ISO timestamp")
