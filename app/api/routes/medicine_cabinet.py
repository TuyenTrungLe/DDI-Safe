"""Medicine Cabinet API endpoints."""

import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from app.agents.models import DrugInteraction
from app.models.requests import AddDrugRequest, SaveInteractionCheckRequest
from app.models.responses import (
    AddDrugResponse,
    MedicineCabinetListResponse,
    DrugInteractionsResponse,
    DrugInteractionInfo,
    DrugWithInteractions,
    ErrorResponse,
    InteractionCheckHistoryResponse,
    SaveInteractionCheckResponse,
)
from app.core.medicine_cabinet import medicine_cabinet_manager, utc_now_iso
from app.core.agent import agent_manager

router = APIRouter()


async def check_drug_interactions_background(
    user_id: str, new_drug: str, existing_drugs: List[str]
):
    """
    Background task to check interactions between new drug and existing drugs.

    Args:
        user_id: User identifier
        new_drug: Newly added drug name
        existing_drugs: List of existing drugs in the cabinet
    """
    try:
        # Get the agent to access the graph
        agent = agent_manager.get_agent()
        # graph = agent.graph

        # Map drug names using agent's mapping capability
        # mapped_new_drug = agent.map_drug_name(new_drug)

        # Check interactions with each existing drug
        for existing_drug in existing_drugs:
            agent.clear_memory()
            # Run the blocking agent.query() call in a thread pool executor
            # to prevent blocking the event loop
            answer = await asyncio.to_thread(
                agent.query,
                f"What are the interactions for {new_drug} and {existing_drug}?",
            )
            parsed_result = answer["parsed_result"]

            if parsed_result:
                interaction_result: list[DrugInteraction] = parsed_result.get(
                    "interactions", []
                )
                print(f"interaction_result: {interaction_result}")
                for interaction in interaction_result:
                    details = f"Interaction between {interaction['drug1']} and {interaction['drug2']}: {interaction['details']}"

                    medicine_cabinet_manager.save_interaction_result(
                        user_id=user_id,
                        drug1=interaction["drug1"],
                        drug2=interaction["drug2"],
                        interaction_info=details,
                        severity=None,
                    )

                print(
                    f"Checked interaction: {new_drug} + {existing_drug} -> "
                    f"{'Interaction found' if interaction_result else 'No interaction'}"
                )

            else:
                interaction_result = None
    except Exception as e:
        print(f"Error checking interactions in background: {str(e)}")
        # Still save a result indicating an error occurred
        for existing_drug in existing_drugs:
            medicine_cabinet_manager.save_interaction_result(
                user_id=user_id,
                drug1=new_drug,
                drug2=existing_drug,
                interaction_info=None,
                severity=None,
            )


@router.post(
    "/add",
    response_model=AddDrugResponse,
    summary="Add Drug to Medicine Cabinet",
    description="Add a drug to user's medicine cabinet and check interactions in background",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Drug added successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Agent not available"},
    },
)
async def add_drug(request: AddDrugRequest, background_tasks: BackgroundTasks):
    """
    Add a drug to user's medicine cabinet.

    The drug is added immediately, and interaction checks with existing drugs
    are performed in the background.
    """
    user_id = request.user_id or "admin"
    drug_name = request.drug_name.strip().lower()

    if not drug_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Drug name cannot be empty",
        )

    try:
        agent_manager.get_agent()
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent not loaded",
        )

    # Check if drug already exists
    if medicine_cabinet_manager.has_drug(user_id, drug_name):
        return AddDrugResponse(
            success=False,
            message=f"Drug '{drug_name}' already exists in the medicine cabinet",
            drug_name=drug_name,
            user_id=user_id,
            checking_interactions=False,
            timestamp=utc_now_iso(),
        )

    # Get existing drugs before adding
    existing_drugs = medicine_cabinet_manager.get_drugs(user_id)

    # Add the drug
    added = medicine_cabinet_manager.add_drug(user_id, drug_name)

    if not added:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add drug",
        )

    # Schedule background task to check interactions
    if existing_drugs:
        background_tasks.add_task(
            check_drug_interactions_background,
            user_id=user_id,
            new_drug=drug_name,
            existing_drugs=existing_drugs,
        )
        checking_interactions = True
        message = (
            f"Drug '{drug_name}' added successfully. "
            f"Checking interactions with {len(existing_drugs)} existing drug(s) in the background."
        )
    else:
        checking_interactions = False
        message = f"Drug '{drug_name}' added successfully. No existing drugs to check for interactions."

    return AddDrugResponse(
        success=True,
        message=message,
        drug_name=drug_name,
        user_id=user_id,
        checking_interactions=checking_interactions,
        timestamp=utc_now_iso(),
    )


@router.get(
    "/list",
    response_model=MedicineCabinetListResponse,
    summary="List Medicine Cabinet",
    description="Get all drugs in user's medicine cabinet with their interactions",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Successfully retrieved medicine cabinet"},
    },
)
async def list_medicine_cabinet(user_id: str = "admin"):
    """
    List all drugs in user's medicine cabinet with their interactions.

    Args:
        user_id: User identifier (defaults to 'admin' for mock)
    """
    drugs = medicine_cabinet_manager.get_drugs(user_id)

    # Get interactions for each drug and join them as a string
    drugs_with_interactions = []
    for drug in drugs:
        # Get all interactions for this drug
        interactions = medicine_cabinet_manager.get_interactions_for_drug(user_id, drug)

        # Filter to only interactions that exist (has_interaction=True)
        existing_interactions = [
            interaction
            for interaction in interactions
            if interaction.get("has_interaction", False)
        ]

        # Join multiple interactions as a string
        if existing_interactions:
            interaction_strings = [
                interaction.get("interaction", "")
                for interaction in existing_interactions
                if interaction.get("interaction")
            ]
            interactions_joined = " | ".join(interaction_strings)
        else:
            interactions_joined = None

        drugs_with_interactions.append(
            DrugWithInteractions(drug_name=drug, interactions=interactions_joined)
        )

    return MedicineCabinetListResponse(
        user_id=user_id,
        drugs=drugs_with_interactions,
        count=len(drugs),
        stats=medicine_cabinet_manager.get_cabinet_stats(user_id),
        timestamp=utc_now_iso(),
    )


@router.post(
    "/check-history",
    response_model=SaveInteractionCheckResponse,
    summary="Save Interaction Check History",
    description="Save a complete interaction check result for the user's history",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Interaction check saved successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def save_interaction_check_history(request: SaveInteractionCheckRequest):
    """
    Save a completed interaction check as history.

    This keeps check results separate from medicine cabinet items because a DDI
    result depends on the exact drug combination checked at that time.
    """
    user_id = request.user_id or "admin"
    checked_drugs = [drug.strip() for drug in request.checked_drugs if drug.strip()]

    if not checked_drugs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one checked drug is required",
        )

    record = medicine_cabinet_manager.save_interaction_check(
        user_id=user_id,
        checked_drugs=checked_drugs,
        result_payload=request.result,
        source=request.source or "interaction_check",
    )

    return SaveInteractionCheckResponse(
        success=True,
        message="Interaction check saved successfully",
        record=record,
        stats=medicine_cabinet_manager.get_cabinet_stats(user_id),
        timestamp=utc_now_iso(),
    )


@router.get(
    "/check-history",
    response_model=InteractionCheckHistoryResponse,
    summary="List Interaction Check History",
    description="Get saved interaction check history and derived stats",
    tags=["Medicine Cabinet"],
    responses={200: {"description": "Successfully retrieved interaction history"}},
)
async def list_interaction_check_history(user_id: str = "admin", limit: int = 20):
    """
    List recent interaction check records for a user.
    """
    history = medicine_cabinet_manager.get_check_history(user_id, limit=limit)

    return InteractionCheckHistoryResponse(
        user_id=user_id,
        history=history,
        stats=medicine_cabinet_manager.get_cabinet_stats(user_id),
        count=len(history),
        timestamp=utc_now_iso(),
    )


@router.delete(
    "/check-history",
    summary="Clear Interaction Check History",
    description="Clear saved interaction check history for a user",
    tags=["Medicine Cabinet"],
    responses={200: {"description": "Interaction check history cleared successfully"}},
)
async def clear_interaction_check_history(user_id: str = "admin"):
    """
    Clear only the user's saved interaction check history.
    """
    medicine_cabinet_manager.clear_check_history(user_id)

    return {
        "success": True,
        "message": f"Interaction check history cleared for user '{user_id}'",
        "user_id": user_id,
        "stats": medicine_cabinet_manager.get_cabinet_stats(user_id),
        "timestamp": utc_now_iso(),
    }


@router.delete(
    "/remove/{drug_name}",
    summary="Remove Drug from Medicine Cabinet",
    description="Remove a drug from user's medicine cabinet",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Drug removed successfully"},
        404: {"model": ErrorResponse, "description": "Drug not found"},
    },
)
async def remove_drug(drug_name: str, user_id: str = "admin"):
    """
    Remove a drug from user's medicine cabinet.

    Args:
        drug_name: Name of the drug to remove
        user_id: User identifier (defaults to 'admin' for mock)
    """
    removed = medicine_cabinet_manager.remove_drug(user_id, drug_name)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drug '{drug_name}' not found in medicine cabinet",
        )

    return {
        "success": True,
        "message": f"Drug '{drug_name}' removed successfully",
        "drug_name": drug_name,
        "user_id": user_id,
        "timestamp": utc_now_iso(),
    }


@router.get(
    "/interactions/{drug_name}",
    response_model=DrugInteractionsResponse,
    summary="Get Drug Interactions",
    description="Get all interactions for a specific drug with other drugs in medicine cabinet",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Successfully retrieved interactions"},
        404: {"model": ErrorResponse, "description": "Drug not found in cabinet"},
    },
)
async def get_drug_interactions(drug_name: str, user_id: str = "admin"):
    """
    Get all interactions for a specific drug with other drugs in the cabinet.

    Args:
        drug_name: Name of the drug to check interactions for
        user_id: User identifier (defaults to 'admin' for mock)
    """
    # Check if drug exists in cabinet
    if not medicine_cabinet_manager.has_drug(user_id, drug_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drug '{drug_name}' not found in medicine cabinet",
        )

    # Get interaction results
    interactions = medicine_cabinet_manager.get_interactions_for_drug(
        user_id, drug_name
    )

    # Convert to response format
    interaction_list = [
        DrugInteractionInfo(
            drug1=interaction["drug1"],
            drug2=interaction["drug2"],
            interaction=interaction["interaction"],
            has_interaction=interaction["has_interaction"],
            severity=interaction.get("severity"),
            checked_at=interaction["checked_at"],
        )
        for interaction in interactions
    ]

    # Filter to only show interactions (has_interaction=True)
    interactions_found = [i for i in interaction_list if i.has_interaction]

    return DrugInteractionsResponse(
        drug_name=drug_name,
        user_id=user_id,
        interactions=interactions_found,
        total_interactions=len(interactions_found),
        timestamp=utc_now_iso(),
    )


@router.delete(
    "/clear",
    summary="Clear Medicine Cabinet",
    description="Remove all drugs from user's medicine cabinet",
    tags=["Medicine Cabinet"],
    responses={
        200: {"description": "Medicine cabinet cleared successfully"},
    },
)
async def clear_medicine_cabinet(user_id: str = "admin"):
    """
    Clear all drugs from user's medicine cabinet.

    Args:
        user_id: User identifier (defaults to 'admin' for mock)
    """
    medicine_cabinet_manager.clear_cabinet(user_id)

    return {
        "success": True,
        "message": f"Medicine cabinet cleared for user '{user_id}'",
        "user_id": user_id,
        "timestamp": utc_now_iso(),
    }
