import logging

logger = logging.getLogger(__name__)

QUIZ_ANSWERS: dict[str, int] = {
    "q1": 1,
    "q2": 1,
    "q3": 1,
    "q4": 1,
    "q5": 2,
    "q6": 1,
    "q7": 2,
    "q8": 1,
    "q9": 1,
    "q10": 1,
}

class QuizService:
    @staticmethod
    def calculate_score(answers: list) -> tuple[int, list]:
        score = 0
        feedback = []
        
        for item in answers:
            question_id = str(item.get("questionId", ""))
            selected = item.get("selectedIndex", -1)
            correct = QUIZ_ANSWERS.get(question_id)
            is_correct = correct is not None and selected == correct
            
            if is_correct:
                score += 1
                
            feedback.append({
                "questionId": question_id,
                "isCorrect": is_correct,
                "correctIndex": correct,
            })
            
        return score, feedback

    @staticmethod
    def get_adaptive_difficulty(current: str, last_result: bool) -> str:
        difficulty_map = {
            ("easy", True): "medium",
            ("easy", False): "easy",
            ("medium", True): "hard",
            ("medium", False): "easy",
            ("hard", True): "hard",
            ("hard", False): "medium",
        }
        return difficulty_map.get((current, last_result), "easy")
