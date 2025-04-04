import React, { useState, useEffect } from 'react';

/**
 * AI 응답 시간을 표시하는 애니메이션 컴포넌트
 * @param {boolean} isLoading - 로딩 상태
 * @param {number} startTime - 응답 시작 시간 (밀리초)
 * @param {string} color - 텍스트 색상
 * @param {string} fontSize - 폰트 크기
 */
export const ResponseTimer = ({ isLoading, startTime, color = '#666', fontSize = '0.85rem' }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  
  // 타이머 표시 지연 (500ms 이상 로딩이 걸릴 때만 타이머 표시)
  useEffect(() => {
    let delayTimeout;
    
    if (isLoading) {
      delayTimeout = setTimeout(() => {
        setShowTimer(true);
      }, 500);
    } else {
      if (showTimer) {
        // 로딩이 완료되면 최종 시간 저장
        setFinalTime(elapsedTime);
        
        // 타이머를 계속 표시 (3초 후 숨기는 코드 제거)
      } else {
        setElapsedTime(0);
      }
    }
    
    return () => clearTimeout(delayTimeout);
  }, [isLoading, showTimer, elapsedTime]);
  
  // 경과 시간 계산
  useEffect(() => {
    let intervalId;
    
    if (isLoading && showTimer && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000; // 초 단위로 변환
        setElapsedTime(elapsed);
      }, 100);
    }
    
    return () => clearInterval(intervalId);
  }, [isLoading, showTimer, startTime]);
  
  // 시간 포맷팅 (초 또는 분:초)
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}초`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}분 ${remainingSeconds.toFixed(0)}초`;
    }
  };
  
  if (!showTimer) {
    return null;
  }
  
  return (
    <strong><div 
      className="response-timer"
      style={{
        color,
        fontSize: 15,
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        opacity: 0.8,
        margin: '8px 0',
        // fadeOut 애니메이션 제거
      }}
    >
      <div className="timer-icon" style={{ marginRight: '6px' }}>
        {isLoading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="timer-text">
        {isLoading ? (
          <>답변 생성 중: {formatTime(elapsedTime)}</>
        ) : (
          <>답변 생성 완료: {formatTime(finalTime)}</>
        )}
      </div>
    </div>
    </strong>
  );
};

/**
 * AI 응답 시간과 함께 응답을 표시하는 컴포넌트
 * @param {string} text - 표시할 텍스트
 * @param {boolean} isLoading - 로딩 상태
 * @param {number} startTime - 응답 시작 시간 (밀리초)
 * @param {boolean} showTimer - 타이머 표시 여부
 */
export const TimedResponse = ({ text, isLoading, startTime, showTimer = true }) => {
  return (
    <div className="timed-response">
      {showTimer && (
        <ResponseTimer 
          isLoading={isLoading} 
          startTime={startTime} 
        />
      )}
      <div className="response-content">
        {text}
      </div>
    </div>
  );
};