# 🧩 CodeSchooler

> AI-기반 코딩 학습 플랫폼  
> (React - Vite &nbsp;|&nbsp; Flask - Gemini &nbsp;|&nbsp; Spring Boot + MySQL)

| **Preview** | **학습 챗봇** | **실시간 채점** |
|:--:|:--:|:--:|
| <img src="docs/img/main.png" width="260"/> | <img src="docs/img/chat.gif" width="260"/> | <img src="docs/img/judge.gif" width="260"/> |

---

## 📑 Table of Contents
1. [Why CodeSchooler?](#why-codeschooler)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Monorepo Layout](#monorepo-layout)
6. [Quick Start](#quick-start)
7. [Configuration](#configuration)
8. [Local Run (Without Docker)](#local-run-without-docker)
9. [API Reference](#api-reference)
10. [Database Schema](#database-schema)
11. [Front-end Dev Guide](#front-end-dev-guide)
12. [Testing & Quality](#testing--quality)
13. [Contribution Rules](#contribution-rules)
14. [License](#license)

---

## Why CodeSchooler?
* **Gemini 1.5-flash**로 → 주제별 *이론*·*연습문제*·*정답 코드* 자동 생성  
* **Flask** 마이크로서비스가 실시간 채점 & 오류 분석 (*RestrictedPython* 샌드박스)  
* **Spring Boot**가 회원·문제·제출을 관리 + JPA Entity → MySQL  
* **React** + CodeMirror 에디터 + 타이핑 / 로딩 애니메이션으로 몰입감  
→ “**문제 생성 → 풀이 → 피드백 → 통계**” 전 과정이 한 플랫폼 안에서 순환

---

## Features
| 분류 | 기능 | 구현 코드 |
|------|------|----------|
| 학습 콘텐츠 | • `ContentGenerator.generate_theory()`<br>• `generate_exercises()` – 난이도별 문제·정답 자동 생성 | `ai/python_tutor.py` |
| 코드 채점 | • `CodeVerifier.compare_code()` – 샌드박스 실행·출력 비교<br>• 오류 유형 분류(HF 모델) + 수정 제안 | `ai/code_verifier.py` |
| 백엔드 API | • 회원가입/로그인 (JWT off : `SecurityConfig`)<br>• 제출/정답 CRUD REST | `backproject/...` |
| 프런트 UI | • 채팅 / 코드 뷰 전환 슬라이드<br>• 실시간 타이핑·응답 타이머<br>• 성능 파이·바 차트 | `frontend/src/pages/*` |
| DevOps | • `.env` 환경변수 → 모든 레이어 통일<br>• `docker-compose.yml` – 3 컨테이너 (one-network) | root |

---

## System Architecture
```text
┌──────────────┐         REST       ┌────────────────┐
│  React       │  ───────────────►  │  Flask (AI)    │
│  (Vite)      │   /api/chat       │  PythonTutor    │
│  Port 3000   │   /api/submit     │  Gemini / HF    │
└──────┬───────┘                   └──────┬──────────┘
       │                                DB save
       │ REST (JSON)                      │
       ▼                                  ▼
┌────────────────┐      JPA       ┌──────────────────┐
│ Spring Boot    │  ◄──────────►  │   MySQL 8.x      │
│ Port 8080      │                │ codingmachine DB │
└────────────────┘                └──────────────────┘
