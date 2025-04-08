import logging
import google.generativeai as genai
import os
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import asyncio
import aiofiles
import json
import uuid
import time
from dotenv import load_dotenv
import io
import sys
from huggingface_hub import login
import subprocess
import tempfile
import py_compile
import re
import platform
from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.PrintCollector import PrintCollector
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import difflib
import pandas as pd
import aiohttp

load_dotenv()

# --------------------------
# Hugging Face 모델 로그인 및 오류 모델 로드
# --------------------------
hf_token = os.getenv("HF_TOKEN")
if hf_token:
    login(hf_token)

error_model_name = "MilkTeaaaaaeee/1235657"
error_model = AutoModelForSequenceClassification.from_pretrained(
    error_model_name, use_auth_token=True
)
error_tokenizer = AutoTokenizer.from_pretrained(
    error_model_name, use_auth_token=True
)

# --------------------------
# ContentGenerator 클래스
# --------------------------
class ContentGenerator:
    def __init__(self):
        genai.configure(api_key=os.getenv("OPENAI_API_KEY"))
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
        )

    async def generate_content_async(self, prompt):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.model.generate_content, prompt)

    async def generate_theory(self, topic):
        prompt = f"""
        다음 파이썬 주제에 대한 이론을 설명해주세요:
        {topic}

        다음 지침을 따라주세요:
        1. 각 개념에 대해 구체적인 예시를 포함해주세요.
        2. 가능한 경우, 실생활에서의 응용 사례를 들어 설명해주세요.
        3. 중요한 개념은 강조해주세요.
        4. 코드 예제를 통해 설명하는 경우, 코드의 각 부분에 대한 설명을 추가해주세요.
        5. 관련된 다른 주제나 개념과 연결 지어 설명해주세요.
        6. 답변은 한국어로만 작성해주세요.
        """
        response = await self.generate_content_async(prompt)
        return response.text

    async def generate_exercises(self, topic):
        prompt = f"""
        다음 파이썬 주제에 대한 쉬움 난이도의 3개의 연습문제를 생성해주세요:
        {topic}

        각 문제는 이전에 생성된 문제와 중복되지 않아야 합니다.
        각 문제는 다음 형식을 정확히 따라야 합니다:
        문제 번호. 문제 설명 (난이도: 쉬움)
        - 구체적인 지시사항 (여러 줄 가능)
        입력 예:
            (구체적인 사용자 입력 예시)
        출력 예:
            (예시 입력에 대한 구체적인 예상 출력)

        각 문제에 대해 반드시 구체적인 입력 예와 출력 예를 제공해주세요.
        문제는 '---'로 구분해주세요.

        답변은 반드시 한국어로 작성해주세요.
        """
        # 문제(연습문제) 생성
        response = await self.generate_content_async(prompt)
        exercises = await self.parse_exercises(response.text, topic)
        # 생성된 문제 각각에 대해 정답 코드 생성 & DB 저장

        # generate_answer()에 문제 instructions, input_example, output_example까지 넘겨줌
        for exercise in exercises:
            exercise["correct_answer"] = await self.generate_answer(
                topic,
                exercise["question"],
                exercise["instructions"],
                exercise["input_example"],
                exercise["output_example"],
                exercise["number"]
            )
        return exercises

    async def parse_exercises(self, response_text, topic):
        problems = re.split(r'\n\s*---\s*\n', response_text.strip())
        exercises = []
        for idx, problem in enumerate(problems, 1):
            ex = self.parse_single_exercise(problem, idx, topic)
            if ex:
                exercises.append(ex)
        return exercises

    def parse_single_exercise(self, problem_text, idx, topic):
        lines = [line.strip() for line in problem_text.strip().split('\n')]
        if len(lines) < 3:
            return None
        question = lines[0]
        instructions = []
        input_example = ""
        output_example = ""
        current_section = "instructions"
        for line in lines[1:]:
            if line.startswith("입력 예:"):
                current_section = "input"
                continue
            elif line.startswith("출력 예:"):
                current_section = "output"
                continue

            if current_section == "instructions":
                instructions.append(line)
            elif current_section == "input":
                input_example += line + "\n"
            elif current_section == "output":
                output_example += line + "\n"

        if not (question and instructions and input_example and output_example):
            return None
        return {
            "number": f"{idx:03d}",
            "topic": topic,
            "question": question,
            "instructions": instructions,
            "input_example": input_example.strip(),
            "output_example": output_example.strip(),
            "correct_answer": ""
        }

    async def generate_answer(
        self,
        topic,
        question,
        instructions,
        input_example,
        output_example,
        problem_number=None
    ):
        """
        주제에 맞는 로직, 문제의 지시사항/입출력 예시를 정확히 반영하도록 프롬프트 강화
        """
        joined_instructions = "\n".join(instructions)
        prompt = f"""
        아래는 파이썬 연습문제입니다.

        주제: {topic}
        문제 설명: {question}

        상세 지시사항:
        {joined_instructions}

        입력 예:
        {input_example}

        출력 예:
        {output_example}

        아래 요구사항을 반드시 충족하여 파이썬 정답 코드를 작성하세요:
        1) 반드시 위 주제({topic})와 관련된 로직/문법을 활용할 것
        2) 문제에서 제시한 '입력 예'와 '출력 예'에 맞춰 정확히 동작해야 함
        3) 불필요한 추가 출력이나 주석은 넣지 말 것
        4) 문제 지시사항을 충분히 반영할 것

        코드만 작성해주세요.
        """

        response = await self.generate_content_async(prompt)
        answer_code = response.text.strip()
        await self.save_answer_to_db(question, answer_code, problem_number)
        return answer_code

    async def save_answer_to_db(self, question, answer_code, problem_number):
        api_client = APIClient()
        data = {
            "question": question,
            "answer_code": answer_code,
            "problem_number": problem_number
        }
        await api_client.save_answer(data)

    async def generate_hint(self, question, hint_count):
        hint_prompts = [
            f"다음 문제에 대한 첫 번째 힌트를 생성해주세요:\n{question}\n힌트는 문제 해결의 방향을 제시해야 하지만, 직접적인 답은 주지 말고, 한국어로 작성해주세요.",
            f"다음 문제에 대한 추가 힌트를 생성해주세요. 첫 번째 힌트와는 다른 관점에서 접근하도록 작성하되, 한국어로 작성해주세요:\n{question}",
            f"다음 문제에 대한 고급 힌트를 생성해주세요. 문제를 해결하기 위한 구체적인 단계를 제안해주세요. 한국어로 작성해주세요:\n{question}",
            f"다음 문제에 대한 마지막 힌트를 생성해주세요. 가능한 정답에 가까워질 수 있는 방향으로 한국어로 작성해주세요:\n{question}"
        ]
        prompt = hint_prompts[min(hint_count, len(hint_prompts) - 1)]
        response = await self.generate_content_async(prompt)
        return response.text.strip()


# --------------------------
# 커스텀 출력 콜렉터 정의
# --------------------------
class MyPrintCollector:
    def __init__(self):
        self.outputs = []
    def __call__(self, *args, **kwargs):
        self.outputs.append(" ".join(map(str, args)))


# --------------------------
# CodeVerifier 클래스
# --------------------------
class CodeVerifier:
    def __init__(self, api_key):
        # 아래 한 줄 추가 (혹은 유지)해서 generativeai 초기화
        genai.configure(api_key=api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        self.error_model_name = "MilkTeaaaaaeee/1235657"
        self.error_model = AutoModelForSequenceClassification.from_pretrained(
            self.error_model_name, use_auth_token=True
        )
        self.error_tokenizer = AutoTokenizer.from_pretrained(
            self.error_model_name, use_auth_token=True
        )
        self.api_key = api_key

    async def classify_error(self, user_code):
        inputs = self.error_tokenizer(user_code, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = self.error_model(**inputs)
        predicted_class = torch.argmax(outputs.logits, dim=1).item()
        return self.error_model.config.id2label[predicted_class]

    async def execute_code_snippet(self, code_snippet, input_example):
        try:
            output = await self.execute_code(code_snippet, input_example, restricted=True)
            return output
        except Exception as e:
            return f"오류 발생: {e}"

    async def analyze_error(self, user_code):
        try:
            error_type = await self.classify_error(user_code)
            suggestion = await self.generate_suggestion(user_code, error_type)
            return suggestion
        except Exception as e:
            return f"오류 발생: {e}"

    async def generate_suggestion(self, user_code, error_type):
        prompt = f"""
        다음 파이썬 코드에서 오류 유형 '{error_type}'가 감지되었습니다.
        코드:
        {user_code}

        아래 지침을 따르세요:
        - 오류 원인과 수정 제안을 한국어로 작성해주세요.
        - JSON이 아닌 일반 텍스트로만 간단히 제안해도 됩니다.
        """
        response = await self.gemini_model.generate_content(prompt)
        return response.text.strip()

    async def execute_code(self, code, input_example, restricted=True):
        collector = MyPrintCollector()
        restricted_globals = {
            "__builtins__": safe_globals["__builtins__"],
            "_print_": collector,
            "_getattr_": getattr,
            "_getitem_": lambda obj, key: obj[key],
            "_getiter_": iter,
            "input": lambda prompt='': input_example,
        }
        try:
            compiled_code = compile_restricted(code, "<string>", "exec")
            locals_dict = {}
            exec(compiled_code, restricted_globals, locals_dict)
            return "\n".join(collector.outputs)
        except Exception as e:
            raise Exception(f"RestrictedPython 오류: {e}")

    async def additional_validation(self, user_code, correct_answer, user_output, correct_output):
        prompt = f"""
        다음 두 코드의 의미적 차이를 분석해주세요:
        사용자 코드:
        {user_code}
        정답 코드:
        {correct_answer}
        사용자 출력:
        {user_output}
        정답 출력:
        {correct_output}

        분석 결과는 한국어로 작성해주세요.
        """
        response = await self.gemini_model.generate_content(prompt)
        return response.text.strip()

    async def compare_code(self, user_code, correct_answer, input_example, output_example):
        try:
            user_output = await self.execute_code(user_code, input_example, restricted=True)
            correct_output = await self.execute_code(correct_answer, input_example, restricted=True)

            user_output = self.normalize_output(user_output)
            correct_output = self.normalize_output(correct_output)

            additional_validation_result = await self.additional_validation(
                user_code, correct_answer, user_output, correct_output
            )

            await self.save_validation_result_to_db(
                user_code, correct_answer, user_output, correct_output, additional_validation_result
            )

            if user_output == correct_output:
                # 예외: 단순 print('정답') 방지
                if "print('정답')" in user_code and len(user_code.strip()) < 20:
                    return False, "오답입니다. 단순한 출력만으로는 정답으로 처리되지 않습니다."
                else:
                    return True, "정답입니다."
            else:
                return False, f"오답입니다. 예상 출력: {output_example}, 실제 출력: {user_output}"

        except Exception as e:
            logging.error(f"코드 비교 중 오류 발생: {e}")
            return False, f"오류 발생: {e}"

    def normalize_output(self, output):
        return re.sub(r'\s+', ' ', output).strip()

    def check_syntax(self, code):
        try:
            py_compile.compile(io.StringIO(code).read(), '<string>')
            return True
        except py_compile.PyCompileError:
            return False

    # 여기서 "문제" 대신 exercise['question']을 반영해 보다 직설적이 되도록 수정
    async def review_error_and_suggest_correction(self, user_code, exercise, error_type):
        """
        - 문법적 오류가 없고
        - 논리적 오류가 없고
        - 문제에서 지시한 사항을 정확히 이행
        - 문제에서 설명한 입력과 출력이 문제의 의도대로 동작
        - 로직이 오류 없고, 문제에서 의도하는 로직이 잘 반영
        - 문제에서 지시한 내용과 제공 코드가 무관하지 않아야 함
        """
        prompt = f"""
        다음 Python 코드에서 오류를 검토해주세요.

        문제(실제 문제 내용): {exercise['question']}

        사용자 코드:
        {user_code}

        오류 유형 (MilkTeaaaaaeee 모델): {error_type}

        아래 조건들을 모두 만족하는지 확인하세요:
        1) 코드에 문법적 오류가 없는지
        2) 논리적 오류(예: 잘못된 로직, 불필요한 로직 등)가 없는지
        3) '{exercise['question']}'에서 지시한 사항을 정확히 이행하여 정상적으로 동작하는지
        4) '{exercise['question']}'에서 설명한 입력과 출력이 문제의 의도대로 동작해야 함
        5) 로직이 오류가 없더라도 '{exercise['question']}'에서 의도한 로직이 잘 반영되어야 함
        6) '{exercise['question']}'에서 지시한 내용과 제공한 코드가 무관하지 않은지

        모두 만족한다면 "수정이 필요하지 않음"만 "correction_suggestion" 값으로 넣어주세요.

        아래 내용을 반드시 JSON 형태(한글)로만 응답해 주세요:
        {{
          "error_type": "재검토된 오류 유형",
          "error_line": "오류가 있는 라인 표시 (예: 3)",
          "correction_suggestion": "위 조건중 하나라도 만족하지 않으면 구체적인 수정 방안을, 모두 만족하면 '수정이 필요하지 않음' 만 넣어주세요."
        }}
        """
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, prompt)
            result_text = response.text.strip()
            if not result_text:
                logging.error("Gemini 모델 응답이 비어 있습니다.")
                return "오답입니다.\n오류 분석 응답이 비어 있습니다."
            start = result_text.find("{")
            end = result_text.rfind("}")
            if start == -1 or end == -1:
                logging.error("응답에 JSON 객체를 찾을 수 없습니다.")
                return "오답입니다.\n정상적인 JSON 응답을 받지 못했습니다."
            json_str = result_text[start:end+1]
            try:
                result = json.loads(json_str)
            except Exception as e:
                logging.exception("JSON 파싱 오류")
                return "오답입니다.\n오류 분석 JSON 파싱 실패로, 구체적인 수정 제안을 찾을 수 없습니다."
            error_line = result.get("error_line", "알 수 없음")
            suggestion = result.get("correction_suggestion", "수정 제안 없음")
            e_type = result.get("error_type", "알 수 없음")
            return (
                f"오류 유형: {e_type}\n"
                f"오류 라인: {error_line}\n"
                f"수정 제안: {suggestion}"
            )
        except json.JSONDecodeError as e:
            logging.exception(f"Gemini 모델 응답 JSON 파싱 오류: {e}")
            return "오답입니다.\n오류 분석 JSON 파싱 실패로, 구체적인 수정 제안을 찾을 수 없습니다."
        except Exception as e:
            logging.exception(f"Gemini 모델 오류 발생: {e}")
            return "오답입니다.\n오류 분석 중 알 수 없는 문제가 발생했습니다."

    async def save_validation_result_to_db(self, user_code, correct_answer, user_output, correct_output, analysis):
        # 필요하다면 구현
        pass


# --------------------------
# UserProgress 클래스
# --------------------------
class UserProgress:
    def __init__(self, user_id=None, current_topic=None, last_problem_number=0, interaction_count=0):
        self.user_id = user_id
        self.current_topic = current_topic
        self.last_problem_number = last_problem_number
        self.interaction_count = interaction_count


# --------------------------
# APIClient 클래스
# --------------------------
class APIClient:
    def __init__(self):
        self.base_url = "http://localhost:8080/api/submit-code"
        self.max_retries = 3
        self.retry_delay = 1

    async def save_submission(self, data):
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        self.base_url,
                        json=data,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        resp.raise_for_status()
                        return await resp.json()
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logging.error(f"API 호출 실패 (시도 {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    logging.error(f"모든 시도가 실패했습니다. 데이터 저장 실패: {data}")
                    raise
                await asyncio.sleep(self.retry_delay * (attempt + 1))
        return None

    async def save_answer(self, data):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8080/api/save-answer",
                json=data,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                try:
                    resp.raise_for_status()
                    return await resp.json()
                except aiohttp.ClientResponseError as e:
                    logging.error(f"API 요청 실패: {e}")
                    return {"error": str(e)}

    async def get_submissions(self, user_id):
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{self.base_url}/{user_id}",
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        resp.raise_for_status()
                        return await resp.json()
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logging.error(f"API 호출 실패 (시도 {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(self.retry_delay * (attempt + 1))
        return None


# --------------------------
# UserSessionManager 클래스
# --------------------------
class UserSessionManager:
    def __init__(self, db_session=None):
        self.db = db_session
        self.sessions = {}
        self.user_progress = {}
        self.api_client = APIClient()

    async def save_exercises(self, user_id, exercises):
        return

    async def validate_submission(self, user_id, user_code, problem_number):
        answer_code = await self.get_answer_from_db(problem_number)
        similarity = difflib.SequenceMatcher(None, answer_code, user_code).ratio()
        return similarity > 0.8

    async def get_answer_from_db(self, problem_number):
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://localhost:8080/api/get-answer/{problem_number}",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                resp.raise_for_status()
                answers = await resp.json()
                if isinstance(answers, list) and answers:
                    latest_answer = max(answers, key=lambda x: x.get("createdAt", ""))
                    return latest_answer.get("answer_code", "")
                return answers.get("answer_code", "")

    async def load_exercises(self, user_id):
        submissions = await self.api_client.get_submissions(user_id)
        results = []
        if submissions:
            for sub in submissions:
                if sub.get('problem_number', '').startswith('EXERCISE_'):
                    try:
                        ex = json.loads(sub['code'])
                        results.append(ex)
                    except:
                        pass
        return results

    async def analyze_user_profile(self, user_id):
        if user_id in self.user_progress:
            df = pd.DataFrame([self.user_progress[user_id].__dict__])
            return f"사용자 프로필 분석 결과: {df.to_dict(orient='records')}"
        return "프로필 데이터가 없습니다."

    async def is_problem_solved(self, user_id, problem_number):
        solved = [
            exercise["number"]
            for exercise in self.sessions[user_id].get("current_exercises", [])
            if exercise.get("solved", False)
        ]
        return problem_number in solved

    async def save_user_state(self, user_id, state):
        if user_id not in self.user_progress:
            self.user_progress[user_id] = UserProgress(
                user_id=user_id,
                current_topic=state.get('current_topic', '파이썬이란?'),
                last_problem_number=state.get('last_problem', 0),
                interaction_count=state.get('interaction_count', 0)
            )
        else:
            self.user_progress[user_id].current_topic = state.get('current_topic', '파이썬이란?')
            self.user_progress[user_id].last_problem_number = state.get('last_problem', 0)
            self.user_progress[user_id].interaction_count = state.get('interaction_count', 0)

    async def load_user_state(self, user_id):
        if user_id in self.user_progress:
            self.sessions[user_id] = {
                "current_topic": self.user_progress[user_id].current_topic,
                "last_problem": self.user_progress[user_id].last_problem_number,
                "feedback": [],
                "last_feedback_time": time.time(),
                "feedback_count": 0,
                "interaction_count": self.user_progress[user_id].interaction_count,
                "current_exercises": await self.load_exercises(user_id),
                "state": {},
                "hint_counts": {},
                "difficulty_level": "쉬움"
            }
        else:
            self.sessions[user_id] = {
                "current_topic": "파이썬이란?",
                "last_problem": 0,
                "feedback": [],
                "last_feedback_time": time.time(),
                "feedback_count": 0,
                "interaction_count": 0,
                "current_exercises": [],
                "state": {},
                "hint_counts": {},
                "difficulty_level": "쉬움"
            }
            await self.save_user_state(user_id, self.sessions[user_id])

    async def update_user_progress(self, user_id, problem_number):
        pass

    async def update_dashboard(self, user_id):
        state = self.sessions[user_id].get('state', {})
        current_chapter = self.sessions[user_id].get('current_chapter', '01')
        last_problem = self.sessions[user_id].get('last_problem', 0)
        interaction_count = self.sessions[user_id].get('interaction_count', 0)
        logging.info(
            f"사용자 {user_id}의 대시보드 업데이트: 챕터 {current_chapter}, 문제 {last_problem}, 상호작용 {interaction_count}"
        )
        if interaction_count % 10 == 0 and interaction_count != 0:
            feedback = (
                f"🤖 챗봇: {interaction_count}번의 상호작용을 완료하셨습니다! 잘 하고 계십니다.\n"
                f"현재 {current_chapter}장을 학습 중이며, {last_problem}번 문제까지 풀어보셨습니다.\n"
                "계속해서 열심히 학습해 주세요!"
            )
            return feedback
        return ""


# --------------------------
# PythonTutor 클래스
# --------------------------
class PythonTutor:
    def __init__(self, api_key):
        self.logger = logging.getLogger(__name__)
        self.content_generator = ContentGenerator()
        self.current_topic_index = 0
        self.session_manager = UserSessionManager(db_session=None)
        self.api_client = APIClient()
        self.python_topics = [
            "파이썬이란?",
            "파이썬의 특징",
            "파이썬으로 무엇을 할 수 있을까?",
            "파이썬 설치하기",
            "파이썬 둘러보기",
            "파이썬과 에디터",
            "숫자형",
            "문자열 자료형",
            "리스트 자료형",
            "튜플 자료형",
            "딕셔너리 자료형",
            "집합 자료형",
            "불 자료형",
            "변수",
            "if문",
            "while문",
            "for문",
            "함수",
            "사용자 입출력",
            "파일 읽고 쓰기",
            "프로그램의 입출력",
            "클래스",
            "모듈",
            "패키지",
            "예외 처리",
            "내장 함수",
            "표준 라이브러리",
            "외부 라이브러리"
        ]
        self.api_key = api_key
        genai.configure(api_key=self.api_key)
        self.intent_classifier = self.train_intent_classifier()

    async def handle_user_profile_request(self, user_id):
        profile_analysis = await self.session_manager.analyze_user_profile(user_id)
        return f"🤖 챗봇: 사용자 프로필 분석 결과\n\n{profile_analysis}"

    async def get_exercise(self, problem_number, user_id):
        current_topic = self.session_manager.sessions[user_id]["current_topic"]
        ex_list = self.session_manager.sessions[user_id]["current_exercises"]
        for ex in ex_list:
            if ex['number'] == problem_number and ex['topic'] == current_topic:
                return ex
        return None

    async def handle_interactive_problem_request(self, user_input, user_id):
        topic = self.session_manager.sessions[user_id]["current_topic"]
        prompt = f"사용자가 '{user_input}'에 대해 더 알고 싶어합니다. 관련된 정보를 한국어로 제공해주세요."
        response = await self.content_generator.generate_content_async(prompt)
        return f"🤖 챗봇: {response.text}"

    async def handle_exercise_request(self, user_input, user_id):
        topic_match = re.search(r'(.*)\s*연습문제', user_input)
        if topic_match:
            topic = topic_match.group(1).strip()
            exercises = await self.content_generator.generate_exercises(topic)
            self.session_manager.sessions[user_id]["current_exercises"] = exercises
            self.session_manager.sessions[user_id]["current_topic"] = topic
            self.session_manager.sessions[user_id]["last_problem"] = 0

            response = "\n\n".join([
                f"{exercise['number']}. {exercise['question']}\n" +
                "\n".join(exercise['instructions']) + "\n" +
                f"입력 예:\n{exercise['input_example']}\n출력 예:\n{exercise['output_example']}"
                for exercise in exercises
            ])
            return response
        else:
            return "❌ 잘못된 입력입니다. '[주제] 연습문제' 형식으로 입력해주세요."

    async def handle_code_snippet_request(self, code_snippet, user_id):
        try:
            verifier = CodeVerifier(api_key=self.api_key)
            output = await verifier.execute_code_snippet(code_snippet, "")
            if "오류 발생" in output:
                suggestion = await verifier.analyze_error(code_snippet)
                error_type = await verifier.classify_error(code_snippet)
                feedback_message = (
                    f"🤖 챗봇: {error_type} 오류가 발생했습니다.\n\n{output}\n\n수정 제안: {suggestion}"
                )
            else:
                feedback_message = f"🤖 챗봇: 코드 스니펫 실행 결과\n\n{output}"
            return feedback_message
        except Exception as e:
            return f"🤖 챗봇: 오류 발생\n\n{e}"

    async def handle_theory_request(self, user_input, user_id):
        if user_input == "다음 주제":
            self.current_topic_index += 1
            if self.current_topic_index >= len(self.python_topics):
                return "🎉 모든 주제를 완료하셨습니다. 축하합니다!"
            topic = self.python_topics[self.current_topic_index]
            theory_content = await self.content_generator.generate_theory(topic)
            self.session_manager.sessions[user_id]["current_topic"] = topic
            response = (
                f"🤖 챗봇: {topic}에 대한 이론 설명입니다.\n\n" +
                f"{theory_content}\n\n" +
                f"'{topic} 연습문제'라고 입력하시면 문제를 제공해드립니다."
            )
            return response
        else:
            topic_match = re.search(r'(.*)\s*이론', user_input)
            if topic_match:
                topic = topic_match.group(1).strip()
                if topic not in self.python_topics:
                    return f"❌ 존재하지 않는 주제입니다: {topic}"
                if self.python_topics.index(topic) < self.current_topic_index:
                    return f"❌ 이미 완료한 주제입니다: {topic}"
                theory_content = await self.content_generator.generate_theory(topic)
                self.session_manager.sessions[user_id]["current_topic"] = topic
                self.current_topic_index = self.python_topics.index(topic)
                return f"🤖 챗봇: {topic}에 대한 이론 설명입니다.\n\n{theory_content}"
            else:
                return "❌ 잘못된 입력입니다. '[주제] 이론' 형식으로 입력해주세요."

    async def handle_hint_request(self, user_input, user_id):
        parts = user_input.split()
        if len(parts) < 2:
            return "❌ 잘못된 입력입니다. '힌트 [문제번호]'를 입력해주세요. 예: '힌트 001'"
        problem_number = parts[1]
        exercise = await self.get_exercise(problem_number, user_id)
        if not exercise:
            return f"❌ 존재하지 않는 문제 번호이거나 현재 토픽과 맞지 않습니다: {problem_number}"
        hint_count = self.session_manager.sessions[user_id].get("hint_counts", {}).get(problem_number, 0)
        hint = await self.content_generator.generate_hint(exercise["question"], hint_count)
        if "hint_counts" not in self.session_manager.sessions[user_id]:
            self.session_manager.sessions[user_id]["hint_counts"] = {}
        self.session_manager.sessions[user_id]["hint_counts"][problem_number] = hint_count + 1
        return f"🤖 챗봇: {problem_number}번 문제 힌트:\n\n{hint}"

    async def handle_more_exercise_request(self, user_input, user_id):
        if user_input != "더 풀기":
            return "❌ 잘못된 입력입니다. '더 풀기'를 입력해주세요."
        current_topic = self.session_manager.sessions[user_id]["current_topic"]
        current_difficulty = self.session_manager.sessions[user_id].get("difficulty_level", "쉬움")
        difficulty_levels = ["쉬움", "보통", "어려움"]
        current_index = difficulty_levels.index(current_difficulty)

        if current_index == len(difficulty_levels) - 1:
            self.current_topic_index += 1
            if self.current_topic_index >= len(self.python_topics):
                return "🎉 모든 주제를 완료하셨습니다. 축하합니다!"
            next_topic = self.python_topics[self.current_topic_index]
            intro = f"🆕 새로운 주제: {next_topic}\n\n"
            intro += await self.content_generator.generate_theory(next_topic)
            new_exercises = await self.content_generator.generate_exercises(next_topic)
            self.session_manager.sessions[user_id]["last_problem"] = 0
            self.session_manager.sessions[user_id]["current_exercises"] = new_exercises
            self.session_manager.sessions[user_id]["current_topic"] = next_topic
            self.session_manager.sessions[user_id]["difficulty_level"] = "쉬움"
            return intro + "\n" + self.format_exercises(new_exercises)
        else:
            new_difficulty = difficulty_levels[current_index + 1]
            self.session_manager.sessions[user_id]["difficulty_level"] = new_difficulty

            # generate_exercises_with_difficulty가 있다고 가정
            new_exercises = await self.content_generator.generate_exercises_with_difficulty(
                current_topic, new_difficulty
            )

            self.session_manager.sessions[user_id]["last_problem"] = 0
            self.session_manager.sessions[user_id]["current_exercises"].extend(new_exercises)
            return f"📚 {current_topic} 추가 연습문제:\n\n" + self.format_exercises(new_exercises)

    def format_exercises(self, exercises):
        response = ""
        for exercise in exercises:
            response += f"{exercise['number']}. {exercise['question']}\n"
            for instruction in exercise["instructions"]:
                response += f"   {instruction}\n"
            response += f"   입력 예:\n{exercise['input_example']}\n"
            response += f"   출력 예:\n{exercise['output_example']}\n\n"
        return response

    async def handle_code_submission(self, code, problem_number, user_id):
        if not code.strip():
            return {"success": False, "message": "코드를 입력해주세요."}

        exercise = await self.get_exercise(problem_number, user_id)
        if not exercise:
            return {
                "success": False,
                "message": f"존재하지 않는 문제 번호이거나 현재 토픽과 맞지 않습니다: {problem_number}"
            }

        try:
            verifier = CodeVerifier(api_key=self.api_key)
            is_correct, compare_msg = await verifier.compare_code(
                code,
                exercise["correct_answer"],
                exercise["input_example"],
                exercise["output_example"]
            )
            if is_correct:
                exercise["solved"] = True
                submission_data = {
                    "user_id": user_id,
                    "code": code,
                    "problem_number": problem_number,
                    "is_correct": True,
                    "feedback": "정답"
                }
                await self.api_client.save_submission(submission_data)
                self.session_manager.sessions[user_id]["interaction_count"] += 1
                await self.session_manager.save_user_state(user_id, self.session_manager.sessions[user_id])
                return {
                    "success": True,
                    "is_correct": True,
                    "message": "정답입니다! 다음 문제에 도전해보세요.",
                    "feedback": await self.session_manager.update_dashboard(user_id)
                }

            error_type = await verifier.classify_error(code)
            suggestion = await verifier.review_error_and_suggest_correction(code, exercise, error_type)

            submission_data = {
                "user_id": user_id,
                "code": code,
                "problem_number": problem_number,
                "is_correct": False,
                "feedback": suggestion
            }
            await self.api_client.save_submission(submission_data)
            self.session_manager.sessions[user_id]["interaction_count"] += 1
            await self.session_manager.save_user_state(user_id, self.session_manager.sessions[user_id])
            return {
                "success": True,
                "is_correct": False,
                "message": f"오답입니다.\n\n{suggestion}",
                "feedback": await self.session_manager.update_dashboard(user_id)
            }

        except Exception as e:
            logging.error(f"코드 검증/저장 중 오류 발생: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"시스템 오류: {str(e)}",
                "feedback": "문제가 지속되면 관리자에게 문의해주세요."
            }

    def train_intent_classifier(self):
        X = [
            "파이썬 이론 설명해줘", "리스트 자료형에 대해 알려줘",
            "연습문제 풀고 싶어", "문제 좀 내줘",
            "힌트 주세요", "001번 문제 힌트",
            "정답이 뭐야", "답 알려줘",
            "더 풀고 싶어", "추가 문제 주세요"
        ]
        y = [
            'theory', 'theory',
            'exercise', 'exercise',
            'hint', 'hint',
            'answer', 'answer',
            'more_exercises', 'more_exercises'
        ]
        model = make_pipeline(TfidfVectorizer(), MultinomialNB())
        model.fit(X, y)
        return model

    async def intent_recognition(self, user_input):
        pattern_map = {
            'theory': r'(이론)',
            'exercise': r'(연습문제)',
            'hint': r'^힌트',
            'more_exercises': r'^더\s*풀기$'
        }
        for intent, pattern in pattern_map.items():
            if re.search(pattern, user_input):
                return intent
        predicted_intent = self.intent_classifier.predict([user_input])[0]
        return predicted_intent

    async def get_intent_handler(self, intent):
        handlers = {
            'theory': self.handle_theory_request,
            'exercise': self.handle_exercise_request,
            'hint': self.handle_hint_request,
            'more_exercises': self.handle_more_exercise_request,
        }
        return handlers.get(intent, self.handle_unknown_intent)

    async def handle_unknown_intent(self, user_input, user_id):
        return "죄송합니다. 이해하지 못했습니다. 다시 말씀해주세요."

    async def handle_user_input(self, user_input, user_id):
        try:
            if user_input.strip().lower() == "더 풀기":
                response = await self.handle_more_exercise_request(user_input, user_id)
            else:
                intent = await self.intent_recognition(user_input)
                handler = await self.get_intent_handler(intent)
                response = await handler(user_input, user_id)

            self.session_manager.sessions[user_id]["interaction_count"] += 1
            await self.session_manager.save_user_state(user_id, self.session_manager.sessions[user_id])
            feedback = await self.session_manager.update_dashboard(user_id)
            if feedback:
                response += f"\n\n{feedback}"
            return response
        except Exception as e:
            logging.error(f"입력 처리 오류: {e}", exc_info=True)
            return f"❌ 오류 발생: {e}"

    async def handle_error(self, error):
        error_message = f"❌ 요청 처리 중 오류 발생: {str(error)}"
        logging.error(error_message, exc_info=True)
        return error_message


logging.basicConfig(
    level=logging.INFO,
    encoding='utf-8',
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("python_tutor.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)


async def start_conversation():
    # USER_ID 환경변수 사용 (없으면 uuid로)
    user_id = os.getenv("USER_ID")
    if not user_id:
        user_id = str(uuid.uuid4())

    tutor = PythonTutor(os.getenv("OPENAI_API_KEY"))
    await tutor.session_manager.load_user_state(user_id)
    logging.info(f"새로운 사용자 세션 시작: {user_id}")

    print("🤖 챗봇: 안녕하세요! 파이썬 학습 챗봇입니다. 다음과 같은 명령어를 사용할 수 있습니다:")
    print("   1. '[주제] 이론' - 해당 주제의 이론을 제공합니다. 예: '파이썬이란? 이론'")
    print("   2. '[주제] 연습문제' - 해당 주제의 연습문제를 제공합니다. 예: 'while문 연습문제'")
    print("   3. '힌트 [문제번호]' - 특정 문제에 대한 힌트를 제공합니다. 예: '힌트 001'")
    print("   4. '더 풀기' - 추가 연습문제를 요청합니다.")
    print("   5. '종료' - 세션을 종료합니다.")
    print("\n사용 가능한 주제:")
    for topic in tutor.python_topics:
        print(f"   - {topic}")

    while True:
        user_input = await asyncio.get_event_loop().run_in_executor(None, input, "사용자: ")
        if user_input.lower() == "종료":
            logging.info(f"사용자 {user_id} 세션 종료")
            print("🤖 챗봇: 학습을 종료합니다. 수고하셨습니다!")
            break

        response = await tutor.handle_user_input(user_input, user_id)
        print(response)

        if "코드를 입력해주세요" in response:
            print("여러 줄의 코드를 입력하세요. 입력 종료는 빈 줄로 하세요.")
            code = await read_multiline_input()
            problem_number = await asyncio.get_event_loop().run_in_executor(None, input, "문제 번호를 입력하세요: ")
            result = await tutor.handle_code_submission(code, problem_number, user_id)
            print(result["message"])
            if result.get("feedback"):
                print(result["feedback"])


async def read_multiline_input():
    lines = []
    while True:
        line = await asyncio.get_event_loop().run_in_executor(None, input)
        if line.strip() == "":
            break
        lines.append(line)
    return "\n".join(lines)


if __name__ == "__main__":
    asyncio.run(start_conversation())
