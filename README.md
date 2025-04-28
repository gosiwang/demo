# 🐍 PythonTutor AI 학습 플랫폼

**PythonTutor**는 파이썬 개념 학습·연습문제 생성·자동 채점·실시간 피드백을 한 자리에서 제공하는 웹 애플리케이션입니다.  
백엔드는 Flask + Gemini API, 프론트엔드는 React + CodeMirror를 사용하며 MySQL로 제출/정답 데이터를 관리합니다.

---

## ✨ 주요 기능

| 그룹 | 설명 |
| ---- | ---- |
| 학습 챗봇 | 주제별 **이론**·**연습문제** 생성, 다국어 지원(기본 한국어) |
| 자동 채점 | RestrictedPython 샌드박스 실행 → 정답 코드 비교 → 오류 유형 분류 & 수정 제안 |
| 힌트 시스템 | 요청 횟수에 따라 난이도를 조절해 1~4단계 힌트 제공 |
| 대시보드 알림 | 10번 단위 상호작용마다 진행 상황·격려 메시지 출력 |
| 실시간 코드 편집 | CodeMirror (vscode-dark 테마) + 문제 번호별 코드 제출 UI |
| REST API | `/api/chat`, `/api/submit-code`, `/api/change-problem` 등 |

---

## 🛠️ 기술 스택

- **Backend** : Python 3.11, Flask 2.x, asyncio, Gemini 1.5 Flash, RestrictedPython, SQLAlchemy(JPA 추상화는 Spring용)
- **Frontend**: React 18, Vite, CodeMirror @uiw, Tailwind(선택)  
- **Database** : MySQL 8, JPA(Hibernate) – Spring Boot 예제 코드 포함
- **ML 모델** : Hugging Face `MilkTeaaaaaeee/1235657` (오류 분류), scikit-learn(TFIDF + Naive Bayes 의도 분류)
- **DevOps** : dotenv, docker-compose(선택), logging

---

## 📂 디렉터리 구조

