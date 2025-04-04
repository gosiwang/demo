import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
// ★ vscodeDark 테마를 쓰기 위해 @uiw/codemirror-theme-vscode 에서 가져옴
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { TypeWriter, TypingLoader } from "./ChatLoader";
import { ResponseTimer } from "./ResponseTimer";

// 전체 화면 로딩 애니메이션 컴포넌트
const FullscreenLoading = ({ 
  isLoading, 
  message = "채점 중...", 
  spinnerColor = '#4CAF50', 
  textColor = '#ffffff' 
}) => {
  if (!isLoading) return null;
  
  return (
    <div className="fullscreen-loading-overlay">
      <div className="fullscreen-loading-container">
        <div className="fullscreen-spinner"></div>
        <div className="fullscreen-message" style={{ color: textColor }}>
          {message}
        </div>
      </div>
    </div>
  );
};

// 코드 블록을 렌더링하는 컴포넌트 (읽기 전용 CodeMirror + 복사 버튼)
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("복사 실패:", e);
    }
  };

  return (
    <div style={{ position: "relative", margin: "10px 0" }}>
      {/* CodeMirror + vscodeDark 테마 적용 */}
      <CodeMirror
        value={code}
        height="auto"
        theme={vscodeDark}
        extensions={[python()]}
        editable={false}
      />
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          padding: "4px 8px",
          fontSize: "0.8rem",
          cursor: "pointer"
        }}
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

export default function LearnPage() {
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentView, setCurrentView] = useState("chat");
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [codeResponseModal, setCodeResponseModal] = useState(null);
  const [introModal, setIntroModal] = useState(null);

  // 현재 문제 번호 상태 (초기값 "001")
  const [currentProblemNumber, setCurrentProblemNumber] = useState("001");
  
  // 타이핑 효과를 위한 추가 state
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  
  // 응답 시간 측정을 위한 state
  const [responseStartTime, setResponseStartTime] = useState(null);
  
  // 코드 제출 로딩 상태
  const [codeSubmitLoading, setCodeSubmitLoading] = useState(false);

  // 디자인 관련 상수
  const COLORS = useMemo(() => ({
    darkBackground: "#121212",
    darkEditor: "#121212",
    darkText: "#ffffff",
    darkBorder: "#333333",
    lightBackground: "#ffffff",
    lightText: "#333333",
    lightBorder: "#dddddd",
    accentColor: "#6610f2",
    logoutButtonColor: "#1FACFF",
  }), []);

  const NAVBAR_HEIGHT = 60;
  const editorContainerRef = useRef(null);
  const appContainerRef = useRef(null);

  // 로그아웃 버튼 스타일링 보조 함수
  const styleLogoutButton = useCallback((button, applyStyles) => {
    if (applyStyles) {
      button.style.backgroundColor = COLORS.logoutButtonColor;
      button.style.color = COLORS.darkText;
      button.style.border = `1px solid ${COLORS.logoutButtonColor}`;
      button.style.transition = "all 0.3s ease";
    } else {
      button.style.backgroundColor = "";
      button.style.color = "";
      button.style.border = "";
      button.style.transition = "";
    }
  }, [COLORS]);

  // 네비게이션 스타일 업데이트
  const updateNavbarStyles = useCallback((applyStyles) => {
    const navElements = document.querySelectorAll(".navbar a, header a, .navbar-brand, .logo, nav a");
    navElements.forEach((element) => {
      if (applyStyles) {
        element.style.color = COLORS.darkText;
        element.style.transition = "color 0.3s ease";
      } else {
        element.style.color = "";
        element.style.transition = "";
      }
    });
    // 로그아웃 버튼 찾아서 스타일 적용
    const findLogoutButtons = () => {
      const buttons = document.querySelectorAll("button");
      return Array.from(buttons).filter((button) => {
        const buttonText = button.textContent.trim().toLowerCase();
        return buttonText.includes("로그아웃") || buttonText.includes("log out");
      });
    };
    const logoutButtons = findLogoutButtons();
    if (logoutButtons.length === 0) {
      const possibleLogoutButtons = document.querySelectorAll(".logout-button, button[type='button']");
      possibleLogoutButtons.forEach((button) => {
        if (
          button.textContent.toLowerCase().includes("로그") ||
          button.textContent.toLowerCase().includes("log") ||
          button.getAttribute("aria-label")?.toLowerCase().includes("logout")
        ) {
          styleLogoutButton(button, applyStyles);
        }
      });
    } else {
      logoutButtons.forEach((button) => styleLogoutButton(button, applyStyles));
    }
    const userNameElements = document.querySelectorAll(".user-name, .username, .user-info");
    userNameElements.forEach((element) => {
      element.style.color = applyStyles ? COLORS.darkText : "";
    });
    const navbar = document.querySelector(".navbar") || document.querySelector("header") || document.querySelector("nav");
    if (navbar && applyStyles) {
      navbar.style.backgroundColor = COLORS.darkBackground;
      navbar.style.borderBottom = `1px solid ${COLORS.darkBorder}`;
    } else if (navbar) {
      navbar.style.backgroundColor = "";
      navbar.style.borderBottom = "";
    }
  }, [COLORS, styleLogoutButton]);

  // 마운트 시점에 네비게이션 스타일 적용 및 resize 이벤트 등록
  useEffect(() => {
    setMounted(true);
    updateNavbarStyles(true);

    const measureNavbarHeight = () => {
      const navbar = document.querySelector(".navbar") || document.querySelector("header");
      return navbar ? navbar.offsetHeight + 20 : NAVBAR_HEIGHT;
    };
    const handleResize = () => {
      if (appContainerRef.current) {
        const navHeight = measureNavbarHeight();
        appContainerRef.current.style.height = `calc(100vh - ${navHeight}px)`;
        appContainerRef.current.style.marginTop = `${navHeight}px`;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      updateNavbarStyles(false);
    };
  }, [updateNavbarStyles]);

  // user_id 로컬스토리지에 저장
  const [userId] = useState(() => {
    const stored = localStorage.getItem("user_id");
    if (stored) return stored;
    const newId = Date.now().toString();
    localStorage.setItem("user_id", newId);
    return newId;
  });

  // 코드 에디터 스크롤 방지
  const preventScrollAboveHeader = () => {
    if (editorContainerRef.current) {
      editorContainerRef.current.scrollTop = 0;
    }
  };

  // 코드/채팅 전환 시점 다크모드 적용 여부
  useEffect(() => {
    if (currentView === "code" && editorContainerRef.current) {
      preventScrollAboveHeader();
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    updateNavbarStyles(true);
  }, [currentView, showCodeEditor, isDarkMode, updateNavbarStyles]);

  // 코드 에디터와 채팅 전환 토글
  const toggleCodeEditor = () => {
    if (currentView === "chat") {
      setShowCodeEditor(true);
      setTimeout(() => setCurrentView("code"), 50);
    } else {
      setCurrentView("chat");
      setTimeout(() => setShowCodeEditor(false), 500);
    }
  };

  // 채팅 제출 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);

    const startTime = Date.now();
    setResponseStartTime(startTime);
    setShowTypingEffect(false);
    setCurrentTypingIndex(-1);

    // 채팅 기록에 사용자 메시지 추가
    setChatHistory((prev) => [...prev, { user: inputText, ai: null, loading: true, startTime }]);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputText, user_id: userId }),
      });

      const data = await response.json();

      // AI 응답 반영
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          user: newHistory[newHistory.length - 1].user,
          ai: data.response,
          loading: false,
          startTime,
          endTime: Date.now()
        };
        return newHistory;
      });

      setCurrentTypingIndex(chatHistory.length);
      setShowTypingEffect(true);

    } catch (error) {
      console.error("Error fetching AI response:", error);
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].loading = false;
        newHistory[newHistory.length - 1].ai = "오류가 발생했습니다. 다시 시도해주세요.";
        newHistory[newHistory.length - 1].endTime = Date.now();
        return newHistory;
      });
    }

    setLoading(false);
    setInputText("");
  };

  // 코드 제출 함수
  const handleCodeSubmit = async () => {
    if (!code.trim() || codeSubmitLoading) return;

    setCodeSubmitLoading(true);

    try {
      // Flask API 호출
      const flaskResponse = await fetch("http://127.0.0.1:5000/api/submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          code: code,
          problem_number: currentProblemNumber,
        }),
      });
      const flaskData = await flaskResponse.json();

      // 서버에서 전달받은 메시지
      const messageFromServer = flaskData.message ?? "";

      // (1) "수정이 필요하지 않음" 포함 시 => 모달에는 "정답입니다!"만 표시
      // (2) 그 외에는 => "오답입니다!"라고 표시하되, 서버 메시지(수정제안, 오류 라인 등)도 보여줌
      if (messageFromServer.includes("수정이 필요하지 않음")) {
        setCodeResponseModal({
          message: "정답입니다!",  // ONLY "정답입니다!" 노출
          type: "success"
        });
      } else {
        // 오답 시, 원본 메시지(수정제안, 오류유형 등) 표시
        setCodeResponseModal({
          message: messageFromServer,
          type: "error"
        });
      }

    } catch (error) {
      console.error("Error submitting code:", error);
      setCodeResponseModal({ message: "오류가 발생했습니다. 다시 시도해주세요.", type: "error" });
    } finally {
      setCodeSubmitLoading(false);
    }
  };

  // 서버 메시지 파싱해서 모달에 표시 (오류 라인/오류 유형/수정제안 등)
  const renderModalMessage = (message, isCorrect) => {
    // "정답입니다!"만 표시하는 경우라면, 바로 반환
    if (message === "정답입니다!") {
      return (
        <p
          style={{
            fontSize: "20px",
            margin: "10px 0",
            textAlign: "center"
          }}
        >
          정답입니다!
        </p>
      );
    }

    // 오답(에러) 케이스는 message에 서버에서 온 수정제안, 오류 라인 등이 담겨 있으므로
    // 코드블록 파싱 로직을 통해 기존과 동일하게 표시
    const elements = [];
    const regex = /```python([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        const textPart = message.slice(lastIndex, match.index);
        elements.push(
          <p
            key={`text-${lastIndex}`}
            style={{
              fontSize: "20px",
              margin: "10px 0",
              textAlign: "left",
              whiteSpace: "pre-wrap"
            }}
          >
            {textPart}
          </p>
        );
      }
      const codeContent = match[1].trim();
      elements.push(<CodeBlock key={`code-${match.index}`} code={codeContent} />);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < message.length) {
      const remainingText = message.slice(lastIndex);
      elements.push(
        <p
          key={`text-end`}
          style={{
            fontSize: "20px",
            margin: "10px 0",
            textAlign: "left",
            whiteSpace: "pre-wrap"
          }}
        >
          {remainingText}
        </p>
      );
    }
    return elements;
  };

  // 페이지 로드시 기본 안내 모달
  useEffect(() => {
    setIntroModal({
      message: `파이썬 학습을 위한 다양한 주제들이 준비되어 있습니다.
원하는 주제를 선택하고, '이론' 또는 '연습문제'를 추가하여 채팅창에 입력해주세요.
예를 들어, '내장 함수 이론' 또는 '내장 함수 연습문제'와 같이 입력하시면 됩니다.
다음은 학습 가능한 주제 목록입니다.

파이썬의 특징
파이썬으로 무엇을 할 수 있을까?
파이썬 설치하기
파이썬 둘러보기
파이썬과 에디터
숫자형
문자열 자료형
리스트 자료형
튜플 자료형
딕셔너리 자료형
집합 자료형
불 자료형
변수
if문
while문
for문
함수
사용자 입출력
파일 읽고 쓰기
프로그램의 입출력
클래스
모듈
패키지
예외 처리
내장 함수
표준 라이브러리
외부 라이브러리`,
      type: "info"
    });
  }, []);

  return (
    <div
      className={`app-container ${isDarkMode ? "dark-mode" : "light-mode"}`}
      ref={appContainerRef}
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        marginTop: `${NAVBAR_HEIGHT}px`,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        width: "100%",
        backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground,
        transition: "background-color 0.5s ease-in-out",
      }}
    >
      {/* 전체 화면 로딩 애니메이션 */}
      <FullscreenLoading 
        isLoading={codeSubmitLoading} 
        message="채점 중..." 
        spinnerColor="#4CAF50"
      />
      
      <div
        className="view-container"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          padding: "20px",
          transform: currentView === "chat" ? "translateX(0)" : "translateX(-100%)",
          opacity: mounted && currentView === "chat" ? 1 : 0,
          transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
          zIndex: currentView === "chat" ? 2 : 1,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          color: isDarkMode ? COLORS.darkText : COLORS.lightText,
        }}
      >
        <h2 className="section-title" style={{ color: isDarkMode ? COLORS.darkText : COLORS.lightText }}>
          💡 AI 학습 챗봇
        </h2>

        <div
          className="chat-container"
          style={{
            flex: 1,
            overflowY: "auto",
            border: `1px solid ${isDarkMode ? COLORS.darkBorder : COLORS.lightBorder}`,
            padding: "10px",
            borderRadius: "8px",
            boxShadow: isDarkMode ? "inset 0 2px 5px rgba(0,0,0,0.3)" : "inset 0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "15px",
            backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground,
            color: isDarkMode ? COLORS.darkText : COLORS.lightText,
          }}
        >
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-message">
              <p>
                <strong>🙋‍♂️ 사용자:</strong> {chat.user}
                {chat.loading && (
                  <ResponseTimer 
                    isLoading={true} 
                    startTime={chat.startTime} 
                    color={isDarkMode ? '#aaa' : '#666'}
                  />
                )}
              </p>
              <p>
                <strong>🤖 AI:</strong>{" "}
                {chat.loading ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>AI가 응답을 작성 중입니다</span>
                    <TypingLoader color={isDarkMode ? '#ffffff' : '#333333'} />
                  </div>
                ) : (
                  <>
                    {chat.startTime && (
                      <ResponseTimer 
                        isLoading={false} 
                        startTime={chat.startTime} 
                        color={isDarkMode ? '#aaa' : '#666'}
                      />
                    )}
                    {showTypingEffect && index === currentTypingIndex ? (
                      <TypeWriter 
                        text={chat.ai} 
                        speed={10} 
                        onComplete={() => setShowTypingEffect(false)} 
                      />
                    ) : (
                      <div style={{ fontSize: '20px', lineHeight: '1.5' }}>
                        <ReactMarkdown>{chat.ai}</ReactMarkdown>
                      </div>
                    )}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="input-form" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="텍스트 입력..."
            className="text-input"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${isDarkMode ? COLORS.darkBorder : COLORS.lightBorder}`,
              boxShadow: isDarkMode ? "inset 0 2px 3px rgba(0,0,0,0.3)" : "inset 0 2px 3px rgba(0,0,0,0.1)",
              backgroundColor: isDarkMode ? "#2d2d2d" : COLORS.lightBackground,
              color: isDarkMode ? COLORS.darkText : COLORS.lightText,
            }}
          />
          <button
            type="submit"
            className="button-3d submit-button"
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "80px",
            }}
          >
            {loading ? (
              <TypingLoader color="#ffffff" fontSize="1rem" />
            ) : (
              "제출"
            )}
          </button>

          <button
            type="button"
            onClick={toggleCodeEditor}
            className="button-3d toggle-button"
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: currentView === "code" ? "#6c757d" : COLORS.accentColor,
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
          >
            <span>{currentView === "code" ? "채팅으로" : "코드 작성"}</span>
          </button>
        </form>
      </div>

      {(showCodeEditor || currentView === "code") && (
        <div
          className="view-container"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            padding: "20px",
            backgroundColor: COLORS.darkBackground,
            transform: currentView === "code" ? "translateX(0)" : "translateX(100%)",
            opacity: currentView === "code" ? 1 : 0,
            transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
            zIndex: currentView === "code" ? 2 : 1,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 className="section-title" style={{ color: COLORS.darkText, marginBottom: "15px" }}>
            👨‍💻 코드 작성 - 문제 번호: {currentProblemNumber}
          </h2>

          {/* 문제번호 선택 버튼 - 기존 예시 유지 */}
          <div style={{ marginBottom: "12px", textAlign: "center" }}>
            <span style={{ marginRight: "8px", fontWeight: "bold" }}>문제 선택:</span>
            {["001","002","003"].map((pn) => (
              <button
                key={pn}
                onClick={() => setCurrentProblemNumber(pn)}
                style={{
                  margin: "0 6px",
                  padding: "6px 12px",
                  fontSize: "14px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: pn === currentProblemNumber ? "#ff9800" : "#666666",
                  color: "#ffffff",
                  transition: "background 0.2s ease",
                }}
              >
                {pn}
              </button>
            ))}
          </div>
          
          <div
            className="editor-container"
            ref={editorContainerRef}
            style={{
              flex: 1,
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              borderRadius: "8px",
              overflow: "auto",
              marginBottom: "15px",
              border: `1px solid ${COLORS.darkBorder}`,
              minHeight: "200px",
              maxHeight: "calc(100% - 120px)",
              position: "relative",
              scrollBehavior: "smooth",
              backgroundColor: COLORS.darkEditor,
            }}
          >
            {/* vscodeDark 테마 적용 */}
            <CodeMirror
              value={code}
              height="100%"
              theme={vscodeDark}
              extensions={[python()]}
              onChange={(value) => setCode(value)}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: false,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: false,
                highlightSelectionMatches: true,
                foldKeymap: false,
                scrollPastEnd: false,
              }}
              className="code-editor"
              style={{ backgroundColor: COLORS.darkEditor }}
            />
          </div>

          <div className="button-container" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={handleCodeSubmit}
              className="button-3d submit-button"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#28a745",
                color: "white",
                border: "none",
                cursor: codeSubmitLoading ? "wait" : "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
              }}
              disabled={codeSubmitLoading}
            >
              제출
            </button>
            <button
              onClick={toggleCodeEditor}
              className="button-3d toggle-button"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
              }}
            >
              채팅으로
            </button>
          </div>
        </div>
      )}

      {codeResponseModal && (
        <div className="modal-overlay" onClick={() => setCodeResponseModal(null)}>
          <div
            className={`modal-content ${codeResponseModal.type === "success" ? "success" : "error"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {codeResponseModal.type === "success" && (
              <h3 className="modal-title-center">정답입니다!</h3>
            )}
            {codeResponseModal.type === "error" && (
              <h3 className="modal-title-center">오답입니다!</h3>
            )}
            
            {renderModalMessage(
              codeResponseModal.message, 
              codeResponseModal.type === "success"
            )}

            <button
              className="modal-close-button"
              onClick={() => setCodeResponseModal(null)}
              style={{ display: "block", margin: "20px auto 0 auto" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {introModal && (
        <div className="modal-overlay" onClick={() => setIntroModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ textAlign: "center" }}>학습 안내</h3>
            {(() => {
              const lines = introModal.message.split("\n");
              const introText = lines.slice(0, 4);
              const topics = lines.slice(4).filter(line => line.trim() !== "");
              return (
                <>
                  {introText.map((line, idx) => (
                    <p
                      key={`intro-${idx}`}
                      style={{
                        fontSize: "20px",
                        margin: "10px 0",
                        textAlign: "left",
                        whiteSpace: "pre-wrap",
                        fontWeight: "bold",
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                      }}
                    >
                      {line}
                    </p>
                  ))}
                  {topics.map((line, idx) => (
                    <p
                      key={`topic-${idx}`}
                      style={{
                        fontSize: "20px",
                        margin: "10px 0",
                        textAlign: "left",
                        whiteSpace: "pre-wrap",
                        fontWeight: "bold",
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                      }}
                    >
                      ▸ {line}
                    </p>
                  ))}
                </>
              );
            })()}
            <button
              className="modal-close-button"
              onClick={() => setIntroModal(null)}
              style={{ display: "block", margin: "20px auto 0 auto" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          /* 전체 화면 로딩 애니메이션 스타일 */
          .fullscreen-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
          }
          
          .fullscreen-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .fullscreen-spinner {
            width: 100px;
            height: 100px;
            border: 6px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 6px solid #4CAF50;
            animation: fullscreen-spin 1.5s linear infinite;
            margin-bottom: 20px;
          }
          
          .fullscreen-message {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #ffffff;
          }
          
          @keyframes fullscreen-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* 새로운 타이핑 애니메이션 스타일 */
          @keyframes blinking-cursor {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          /* 네비게이션 바 스타일 (수정 없음) */
          .navbar, header, nav {
            background-color: ${COLORS.darkBackground} !important;
            color: ${COLORS.darkText} !important;
            border-bottom: 1px solid ${COLORS.darkBorder} !important;
            transition: background-color 0.3s ease;
          }
          .navbar a, header a, .navbar-brand, .logo, nav a, .user-name {
            color: ${COLORS.darkText} !important;
            transition: color 0.3s ease;
          }
          button.logout-button, 
          button[aria-label*="logout"],
          button[aria-label*="로그아웃"],
          .navbar button[type="button"],
          header button[type="button"],
          nav button[type="button"] {
            background-color: ${COLORS.logoutButtonColor} !important;
            color: ${COLORS.darkText} !important;
            border: 1px solid ${COLORS.logoutButtonColor} !important;
            transition: all 0.3s ease;
          }
          body.dark-mode {
            background-color: ${COLORS.darkBackground};
            color: ${COLORS.darkText};
          }
          .button-3d:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15), 0 3px 5px rgba(0,0,0,0.1);
          }
          .button-3d:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1);
          }
          .dark-mode input:focus {
            outline: none;
            border-color: #8c44ff;
            box-shadow: inset 0 2px 3px rgba(140,68,255,0.3);
          }
          input:focus {
            outline: none;
            border-color: #6610f2;
            box-shadow: inset 0 2px 3px rgba(102,16,242,0.2);
          }
          .section-title {
            margin-top: 0;
            margin-bottom: 15px;
          }
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            transition: background-color 0.5s ease, color 0.5s ease;
          }
          /* CodeMirror 에디터 스타일 (기존 유지) */
          .cm-editor {
            background-color: ${COLORS.darkEditor} !important;
            color: #d4d4d4 !important;
          }
          .cm-gutters {
            background-color: ${COLORS.darkEditor} !important;
            border-right: 1px solid ${COLORS.darkBorder} !important;
          }
          .cm-activeLineGutter, .cm-activeLine {
            background-color: #1a1a1a !important;
          }
          .editor-container .cm-scroller {
            overflow: auto !important;
          }
          .editor-container .cm-editor {
            padding-top: 10px;
          }
          .editor-container::-webkit-scrollbar,
          .dark-mode ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .editor-container::-webkit-scrollbar-track,
          .dark-mode ::-webkit-scrollbar-track {
            background: ${COLORS.darkBackground};
          }
          .editor-container::-webkit-scrollbar-thumb,
          .dark-mode ::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }
          .editor-container::-webkit-scrollbar-thumb:hover,
          .dark-mode ::-webkit-scrollbar-thumb:hover {
            background:#777;
          }
          .light-mode ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .light-mode ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .light-mode ::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 4px;
          }
          .light-mode ::-webkit-scrollbar-thumb:hover {
            background: #aaa;
          }
          /* 모달 스타일 */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .modal-content {
            background: ${isDarkMode ? "#2d2d2d" : "#fff"};
            color: ${isDarkMode ? COLORS.darkText : COLORS.lightText};
            padding: 20px;
            border-radius: 8px;
            min-width: 300px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 20px;
            line-height: 1.6;
            max-height: 70vh;
            max-width: 600px; /* 가로 폭 제한 */
            overflow-y: auto;
          }
          .modal-content.success {
            border: 3px solid #28a745; /* 정답이면 초록색 테두리 */
          }
          .modal-content.error {
            border: 3px solid #dc3545; /* 오답이면 빨간색 테두리 */
          }
          .modal-content p {
            margin: 15px 0;
          }
          .modal-title-center {
            text-align: center;
            margin: 0 0 20px 0;
          }
          .modal-close-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: ${COLORS.accentColor};
            color: white;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          .modal-close-button:hover {
            background: #532cdd;
          }
        `}
      </style>
    </div>
  );
}
