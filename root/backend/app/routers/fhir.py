import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Measurement, User, get_async_session
from app.users import fastapi_users

fhir_router = APIRouter()

current_active_verified_user = fastapi_users.current_user(active=True, verified=True)


def _vital_category() -> List[Dict[str, Any]]:
    return [
        {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs",
                }
            ]
        }
    ]


def _observation_bp(meas: Measurement, user_id: uuid.UUID) -> Dict[str, Any]:
    return {
        "resourceType": "Observation",
        "id": str(meas.id),
        "status": "final",
        "category": _vital_category(),
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "85354-9",
                    "display": "Blood pressure panel with all children",
                }
            ],
            "text": "Blood pressure",
        },
        "subject": {"reference": f"Patient/{user_id}"},
        "effectiveDateTime": meas.timestamp.isoformat(),
        "component": [
            {
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8480-6",
                            "display": "Systolic blood pressure",
                        }
                    ]
                },
                "valueQuantity": {
                    "value": meas.systolic,
                    "unit": "mmHg",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]",
                },
            },
            {
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8462-4",
                            "display": "Diastolic blood pressure",
                        }
                    ]
                },
                "valueQuantity": {
                    "value": meas.diastolic,
                    "unit": "mmHg",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]",
                },
            },
        ],
    }


def _observation_hr(meas: Measurement, user_id: uuid.UUID) -> Dict[str, Any]:
    return {
        "resourceType": "Observation",
        "id": f"{meas.id}-hr",
        "status": "final",
        "category": _vital_category(),
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "8867-4",
                    "display": "Heart rate",
                }
            ],
            "text": "Heart rate",
        },
        "subject": {"reference": f"Patient/{user_id}"},
        "effectiveDateTime": meas.timestamp.isoformat(),
        "valueQuantity": {
            "value": meas.pulse,
            "unit": "beats/min",
            "system": "http://unitsofmeasure.org",
            "code": "/min",
        },
    }


@fhir_router.get("/Observation")
async def list_observations_fhir(
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Measurement).where(Measurement.user_id == user.id).order_by(Measurement.timestamp.desc())
    )
    measurements = result.scalars().all()
    entries: List[Dict[str, Any]] = []
    for m in measurements:
        entries.append({"fullUrl": f"urn:uuid:{m.id}", "resource": _observation_bp(m, user.id)})
        entries.append({"fullUrl": f"urn:uuid:{m.id}-hr", "resource": _observation_hr(m, user.id)})
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(entries),
        "entry": entries,
    }


def _find_code(codings: List[Dict[str, Any]], system: str, code: str) -> bool:
    for c in codings:
        if c.get("system") == system and c.get("code") == code:
            return True
    return False


def _parse_bp_observation(resource: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if resource.get("resourceType") != "Observation":
        return None
    code = resource.get("code", {})
    codings = code.get("coding", [])
    if not _find_code(codings, "http://loinc.org", "85354-9"):
        return None
    components = resource.get("component", [])
    systolic = diastolic = None
    for comp in components:
        cc = comp.get("code", {}).get("coding", [])
        if _find_code(cc, "http://loinc.org", "8480-6"):
            systolic = int(comp.get("valueQuantity", {}).get("value"))
        elif _find_code(cc, "http://loinc.org", "8462-4"):
            diastolic = int(comp.get("valueQuantity", {}).get("value"))
    if systolic is None or diastolic is None:
        raise HTTPException(status_code=400, detail="Missing systolic or diastolic component")
    effective = resource.get("effectiveDateTime")
    try:
        ts = datetime.fromisoformat(effective) if effective else datetime.now(timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid effectiveDateTime")
    # Optional notes
    notes = None
    if resource.get("note"):
        try:
            notes = " ".join(n.get("text", "") for n in resource["note"]).strip() or None
        except Exception:
            notes = None
    return {"systolic": systolic, "diastolic": diastolic, "timestamp": ts, "notes": notes}


def _extract_hr_from(resource: Dict[str, Any]) -> Optional[int]:
    if resource.get("resourceType") != "Observation":
        return None
    code = resource.get("code", {})
    codings = code.get("coding", [])
    if _find_code(codings, "http://loinc.org", "8867-4"):
        vq = resource.get("valueQuantity", {})
        if "value" in vq:
            return int(vq["value"])
    # Also allow HR as component of the BP panel if present
    for comp in resource.get("component", []):
        cc = comp.get("code", {}).get("coding", [])
        if _find_code(cc, "http://loinc.org", "8867-4"):
            vq = comp.get("valueQuantity", {})
            if "value" in vq:
                return int(vq["value"])
    return None


@fhir_router.post("/Observation")
async def create_observation_fhir(
    payload: Dict[str, Any],
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_async_session),
):
    """Accepts a FHIR Observation or Bundle to create a BP measurement."""
    resources: List[Dict[str, Any]]
    if payload.get("resourceType") == "Bundle":
        resources = [e.get("resource") for e in payload.get("entry", []) if isinstance(e, dict)]
    else:
        resources = [payload]

    bp_data = None
    heart_rate: Optional[int] = None
    for res in resources:
        if not isinstance(res, dict):
            continue
        if bp_data is None:
            try:
                bp_data = _parse_bp_observation(res)
            except HTTPException:
                raise
        if heart_rate is None:
            try:
                heart_rate = _extract_hr_from(res)
            except Exception:
                heart_rate = None

    if not bp_data:
        raise HTTPException(status_code=400, detail="No valid BP Observation (LOINC 85354-9) found")
    if heart_rate is None:
        raise HTTPException(status_code=400, detail="Heart rate (LOINC 8867-4) is required")

    db_obj = Measurement(
        user_id=user.id,
        systolic=bp_data["systolic"],
        diastolic=bp_data["diastolic"],
        pulse=heart_rate,
        timestamp=bp_data["timestamp"],
        tags=[],
        notes=bp_data.get("notes"),
    )
    session.add(db_obj)
    await session.commit()
    # Return the created Observations as a Bundle
    return {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
            {"resource": _observation_bp(db_obj, user.id)},
            {"resource": _observation_hr(db_obj, user.id)},
        ],
    }


@fhir_router.get("/Patient/me")
async def get_patient_me(user: User = Depends(current_active_verified_user)):
    return {
        "resourceType": "Patient",
        "id": str(user.id),
        "active": True,
        "identifier": [
            {
                "system": "mailto:",
                "value": user.email,
            }
        ],
    }

