from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple

class AnalyzeRequest(BaseModel):
    company: str
    use_sample: bool = True

class ReviewAnalysis(BaseModel):
    text: str
    label: str
    score: float

class AnalyzeResponse(BaseModel):
    company: str
    reviews: List[str]
    analyzed: List[ReviewAnalysis]
    counts: Dict[str, int]
    pain_points: List[Tuple[str, int]]
    positives: List[Tuple[str, int]]
    summary: str
