import logging
import os
import asyncio
import uuid
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS

# 두 번째 버전의 PythonTutor가 정의된 ai.py를 불러옵니다.
from ai import PythonTutor

logging.basicConfig(
    level=logging.INFO,
    encoding='utf-8',
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("python_tutor.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)
CORS(app)

def run_async(func):
    """
    Flask 엔드포인트에서 비동기 함수를 호출하기 위한 헬퍼 데코레이터.
    내부적으로 새로운 이벤트 루프를 생성하여 실행한 뒤 종료합니다.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(func(*args, **kwargs))
        finally:
            loop.close()
        return result
    return wrapper

# 환경변수 OPENAI_API_KEY를 사용해 PythonTutor 인스턴스를 생성합니다.
API_KEY = os.getenv("OPENAI_API_KEY", "")
tutor = PythonTutor(API_KEY)

@app.route("/api/chat", methods=["POST"])
@run_async
async def chat():
    """
    클라이언트로부터 메시지를 받아 챗봇 응답을 생성합니다.
    예시 요청 JSON:
    {
      "message": "파이썬이란? 이론",
      "user_id": "abc123"
    }
    """
    data = request.get_json()
    user_input = data.get("message", "")
    user_id = data.get("user_id", str(uuid.uuid4()))
    
    if user_id not in tutor.session_manager.sessions:
        await tutor.session_manager.load_user_state(user_id)
    
    response_text = await tutor.handle_user_input(user_input, user_id)
    return jsonify({"response": response_text, "user_id": user_id})

@app.route("/api/submit-code", methods=["POST"])
@run_async
async def submit_code():
    """
    클라이언트로부터 코드 제출을 받아 채점 및 피드백을 제공합니다.
    예시 POST body:
    {
      "user_id": "abc123",
      "problem_number": "001",
      "code": "print('Hello, World!')"
    }
    """
    data = request.get_json()
    user_id = data.get("user_id")
    code = data.get("code", "")
    problem_number = data.get("problem_number", "")
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    
    if user_id not in tutor.session_manager.sessions:
        await tutor.session_manager.load_user_state(user_id)
    
    result = await tutor.handle_code_submission(code, problem_number, user_id)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
