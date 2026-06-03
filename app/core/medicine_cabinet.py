"""Medicine Cabinet Manager for storing user medications and check history."""

import re
from typing import Any, Dict, List, Set, Optional
from datetime import datetime, timezone
from collections import Counter, defaultdict

from app.core.drug_mapper import map_drug_name


def utc_now_iso() -> str:
    """Return an ISO UTC timestamp with an explicit timezone marker."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class MedicineCabinetManager:
    """Manages medicine cabinets for users."""

    def __init__(self):
        """Initialize the medicine cabinet manager."""
        # Store drugs per user: {user_id: Set[drug_name]}
        self.cabinets: Dict[str, Set[str]] = defaultdict(set)
        # Store interaction results: {user_id: {drug_name: List[interaction_info]}}
        self.interaction_results: Dict[str, Dict[str, List[Dict]]] = defaultdict(
            lambda: defaultdict(list)
        )
        # Store each interaction check event separately from cabinet items.
        self.check_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    def add_drug(self, user_id: str, drug_name: str) -> bool:
        """
        Add a drug to user's medicine cabinet.

        Args:
            user_id: User identifier
            drug_name: Name of the drug to add

        Returns:
            True if added, False if already exists
        """
        drug_name_normalized = self.map_drug_name(drug_name)
        if drug_name_normalized in self.cabinets[user_id]:
            return False

        self.cabinets[user_id].add(drug_name_normalized)
        return True

    def remove_drug(self, user_id: str, drug_name: str) -> bool:
        """
        Remove a drug from user's medicine cabinet.

        Args:
            user_id: User identifier
            drug_name: Name of the drug to remove

        Returns:
            True if removed, False if not found
        """
        drug_name_normalized = self.map_drug_name(drug_name)
        if drug_name_normalized not in self.cabinets[user_id]:
            return False

        self.cabinets[user_id].remove(drug_name_normalized)
        # Clean up interaction results for this drug
        if (
            user_id in self.interaction_results
            and drug_name_normalized in self.interaction_results[user_id]
        ):
            del self.interaction_results[user_id][drug_name_normalized]
        return True

    def get_drugs(self, user_id: str) -> List[str]:
        """
        Get all drugs in user's medicine cabinet.

        Args:
            user_id: User identifier

        Returns:
            List of drug names
        """
        return sorted(list(self.cabinets[user_id]))

    def has_drug(self, user_id: str, drug_name: str) -> bool:
        """
        Check if user has a specific drug in their cabinet.

        Args:
            user_id: User identifier
            drug_name: Name of the drug to check

        Returns:
            True if drug exists in cabinet
        """
        drug_name_normalized = self.map_drug_name(drug_name)
        return drug_name_normalized in self.cabinets[user_id]

    def get_other_drugs(self, user_id: str, exclude_drug: str) -> List[str]:
        """
        Get all drugs except the excluded one.

        Args:
            user_id: User identifier
            exclude_drug: Drug name to exclude

        Returns:
            List of other drug names
        """
        exclude_normalized = self.map_drug_name(exclude_drug)
        return [drug for drug in self.cabinets[user_id] if drug != exclude_normalized]

    def map_drug_name(self, drug_name: str) -> str:
        """
        Map a drug name to its standardized form if mapping is enabled.
        First extracts active ingredient using LLM, then maps to database.

        Args:
            drug_name: The drug name to map

        Returns:
            Mapped drug name or original if mapping not available
        """

        try:
            mapped = map_drug_name(drug_name, threshold=0.5)
            return mapped if mapped else drug_name
        except Exception as e:
            print(f"Error in drug mapping: {e}")
            return drug_name.title()

    def save_interaction_result(
        self,
        user_id: str,
        drug1: str,
        drug2: str,
        interaction_info: Optional[str],
        severity: Optional[str] = None,
    ) -> None:
        """
        Save interaction check result.

        Args:
            user_id: User identifier
            drug1: First drug name
            drug2: Second drug name
            interaction_info: Interaction details or None if no interaction
            severity: Severity level if available
        """
        drug1_normalized = self.map_drug_name(drug1)
        drug2_normalized = self.map_drug_name(drug2)

        result = {
            "drug1": drug1_normalized,
            "drug2": drug2_normalized,
            "interaction": interaction_info,
            "has_interaction": interaction_info is not None,
            "severity": severity,
            "checked_at": utc_now_iso(),
        }

        # Store in both directions for easy lookup
        self.interaction_results[user_id][drug1_normalized].append(result)
        self.interaction_results[user_id][drug2_normalized].append(result)

    def save_interaction_check(
        self,
        user_id: str,
        checked_drugs: List[str],
        result_payload: Any,
        source: str = "interaction_check",
    ) -> Dict[str, Any]:
        """
        Save a complete interaction check event for later review.

        The event history is intentionally separate from cabinet items because
        interactions depend on the drug combination checked at that time.
        """
        normalized_drugs = self._normalize_drug_list(checked_drugs)
        checked_at = utc_now_iso()
        parsed_result = result_payload.get("parsed_result", {}) if isinstance(result_payload, dict) else {}
        interaction_pairs = self._extract_interaction_pairs(parsed_result)
        summary_text = self._extract_result_summary(result_payload, parsed_result)
        overall_risk = self._extract_overall_risk(
            result_payload, parsed_result, interaction_pairs, summary_text
        )
        interactions_found = sum(1 for pair in interaction_pairs if pair["has_interaction"])

        record = {
            "id": f"check-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{len(self.check_history[user_id]) + 1}",
            "user_id": user_id,
            "checked_drugs": normalized_drugs,
            "result_summary": summary_text,
            "overall_risk": overall_risk,
            "total_pairs": len(interaction_pairs),
            "interactions_found": interactions_found,
            "interaction_pairs": interaction_pairs,
            "result": result_payload,
            "source": source,
            "checked_at": checked_at,
        }

        self.check_history[user_id].insert(0, record)
        self.check_history[user_id] = self.check_history[user_id][:50]
        return record

    def get_check_history(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent interaction check events for a user.
        """
        safe_limit = max(1, min(limit, 50))
        return self.check_history[user_id][:safe_limit]

    def get_cabinet_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Return derived stats for the user's cabinet and check history.
        """
        history = self.check_history[user_id]
        checked_drug_counter: Counter[str] = Counter()
        alert_count = 0
        high_risk_checks = 0

        for record in history:
            checked_drug_counter.update(record.get("checked_drugs", []))
            alert_count += int(record.get("interactions_found", 0) or 0)
            if self._is_high_risk(record.get("overall_risk")):
                high_risk_checks += 1

        return {
            "total_saved_drugs": len(self.cabinets[user_id]),
            "total_checks": len(history),
            "total_interaction_alerts": alert_count,
            "high_risk_checks": high_risk_checks,
            "last_checked_at": history[0]["checked_at"] if history else None,
            "most_checked_drugs": [
                {"drug_name": drug, "count": count}
                for drug, count in checked_drug_counter.most_common(5)
            ],
        }

    def clear_check_history(self, user_id: str) -> None:
        """
        Clear only the user's interaction check history.
        """
        self.check_history[user_id].clear()

    def get_interactions_for_drug(self, user_id: str, drug_name: str) -> List[Dict]:
        """
        Get all interaction results for a specific drug.

        Args:
            user_id: User identifier
            drug_name: Name of the drug

        Returns:
            List of interaction results
        """
        drug_name_normalized = self.map_drug_name(drug_name)
        return self.interaction_results[user_id].get(drug_name_normalized, [])

    def clear_cabinet(self, user_id: str) -> None:
        """
        Clear all drugs from user's medicine cabinet.

        Args:
            user_id: User identifier
        """
        self.cabinets[user_id].clear()
        if user_id in self.interaction_results:
            del self.interaction_results[user_id]

    def _normalize_drug_list(self, drugs: List[str]) -> List[str]:
        normalized_drugs: List[str] = []
        seen: Set[str] = set()
        for drug in drugs:
            if not drug or not drug.strip():
                continue
            normalized = self.map_drug_name(drug.strip())
            key = normalized.lower()
            if key not in seen:
                normalized_drugs.append(normalized)
                seen.add(key)
        return normalized_drugs

    def _extract_interaction_pairs(self, parsed_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        pairs: List[Dict[str, Any]] = []
        raw_interactions = parsed_result.get("interactions", []) if isinstance(parsed_result, dict) else []

        for interaction in raw_interactions or []:
            if not isinstance(interaction, dict):
                continue

            details = str(interaction.get("details") or "").strip()
            status = str(interaction.get("status") or "").strip()
            has_interaction = self._has_actual_interaction(status, details)
            pair = {
                "drug1": str(interaction.get("drug1") or "").strip(),
                "drug2": str(interaction.get("drug2") or "").strip(),
                "status": status or ("Has Interaction" if has_interaction else "Safe"),
                "details": details,
                "has_interaction": has_interaction,
                "severity": self._derive_pair_severity(status, details, has_interaction),
            }

            if pair["drug1"] and pair["drug2"]:
                pairs.append(pair)

        return pairs

    def _extract_result_summary(
        self, result_payload: Any, parsed_result: Dict[str, Any]
    ) -> Optional[str]:
        summary = parsed_result.get("summary") if isinstance(parsed_result, dict) else None
        if isinstance(summary, dict) and self._summary_has_useful_data(summary):
            lines: List[str] = []
            if summary.get("overall_risk"):
                lines.append(f"Overall risk: {summary['overall_risk']}")
            if summary.get("major_interactions"):
                lines.append("Key interactions: " + "; ".join(summary["major_interactions"]))
            if summary.get("recommendations"):
                lines.append("Recommendations: " + "; ".join(summary["recommendations"]))
            if lines:
                return "\n".join(lines)

        if isinstance(result_payload, dict) and result_payload.get("answer"):
            answer = str(result_payload["answer"]).strip()
            return self._extract_answer_summary(answer)[:800]

        if isinstance(result_payload, str):
            return self._extract_answer_summary(result_payload.strip())[:800]

        return None

    def _extract_overall_risk(
        self,
        result_payload: Any,
        parsed_result: Dict[str, Any],
        interaction_pairs: List[Dict[str, Any]],
        summary_text: Optional[str],
    ) -> str:
        answer_text = ""
        if isinstance(result_payload, dict) and result_payload.get("answer"):
            answer_text = str(result_payload["answer"])
        elif isinstance(result_payload, str):
            answer_text = result_payload

        answer_risk = self._extract_overall_risk_from_text(answer_text)
        if answer_risk and not self._is_safe_risk(answer_risk):
            return answer_risk

        summary = parsed_result.get("summary") if isinstance(parsed_result, dict) else None
        if isinstance(summary, dict) and summary.get("overall_risk"):
            parsed_risk = str(summary["overall_risk"])
            if not self._is_safe_risk(parsed_risk):
                return parsed_risk

        summary_risk = self._extract_overall_risk_from_text(summary_text or "")
        if summary_risk:
            return summary_risk

        if answer_risk:
            return answer_risk

        if any(pair.get("has_interaction") for pair in interaction_pairs):
            return "Potential interaction"

        if summary_text and any(
            phrase in summary_text.lower()
            for phrase in ["major", "severe", "serious", "nguy hiem", "nghiem trong"]
        ):
            return "Potential interaction"

        return "Low"

    def _summary_has_useful_data(self, summary: Dict[str, Any]) -> bool:
        risk = str(summary.get("overall_risk") or "").strip()
        return bool(
            (risk and not self._is_safe_risk(risk))
            or summary.get("major_interactions")
            or summary.get("recommendations")
        )

    def _extract_answer_summary(self, text: str) -> str:
        final_summary = re.search(
            r"###\s*Final Summary\s*\n([\s\S]*?)(?=\n###|$)",
            text,
            flags=re.IGNORECASE,
        )
        if final_summary and final_summary.group(1).strip():
            return final_summary.group(1).strip()

        overall_risk = re.search(
            r"\*\*Overall Risk:\*\*[\s\S]*?(?=\n###|\n####|$)",
            text,
            flags=re.IGNORECASE,
        )
        if overall_risk and overall_risk.group(0).strip():
            return overall_risk.group(0).strip()

        return text

    def _extract_overall_risk_from_text(self, text: str) -> Optional[str]:
        if not text:
            return None

        match = re.search(
            r"\*{0,2}\s*Overall Risk\s*\*{0,2}\s*:\s*\*{0,2}\s*([^\n\r*]+)",
            text,
            flags=re.IGNORECASE,
        )
        if not match:
            return None

        return match.group(1).strip().strip(".:- ")

    def _has_actual_interaction(self, status: str, details: str) -> bool:
        combined = f"{status}\n{details}".lower()
        has_warning = any(
            phrase in combined
            for phrase in [
                "has interaction",
                "potential interaction",
                "interaction warning",
                "moderate",
                "major",
                "severe",
                "co tuong tac",
            ]
        )
        is_safe = any(
            phrase in combined
            for phrase in [
                "safe",
                "no interaction",
                "no significant interaction",
                "no clinically significant interaction",
                "not found",
                "khong co",
                "khong tim thay",
            ]
        )
        return has_warning or (bool(details) and not is_safe and status.lower() not in {"safe", "none"})

    def _derive_pair_severity(self, status: str, details: str, has_interaction: bool) -> str:
        if not has_interaction:
            return "safe"

        combined = f"{status}\n{details}".lower()
        if any(phrase in combined for phrase in ["major", "severe", "serious"]):
            return "high"
        if any(phrase in combined for phrase in ["moderate", "warning", "potential"]):
            return "moderate"
        return "warning"

    def _is_high_risk(self, overall_risk: Optional[str]) -> bool:
        if not overall_risk:
            return False
        risk = overall_risk.lower()
        return not any(safe in risk for safe in ["none", "low", "safe", "khong"])

    def _is_safe_risk(self, overall_risk: Optional[str]) -> bool:
        if not overall_risk:
            return True
        risk = overall_risk.strip().lower()
        return any(safe in risk for safe in ["none", "low", "safe", "khong"])


# Global medicine cabinet manager instance
medicine_cabinet_manager = MedicineCabinetManager()
