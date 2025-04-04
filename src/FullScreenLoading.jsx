import React from 'react';

/**
 * 전체 화면 로딩 애니메이션 컴포넌트
 * @param {boolean} isLoading - 로딩 상태
 * @param {string} message - 표시할 메시지 (기본값: "채점 중...")
 * @param {string} spinnerColor - 스피너 색상 (기본값: '#4CAF50')
 * @param {string} textColor - 텍스트 색상 (기본값: '#ffffff')
 */
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
      
      <style jsx>{`
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
          border-top: 6px solid ${spinnerColor};
          animation: fullscreen-spin 1.5s linear infinite;
          margin-bottom: 20px;
        }
        
        .fullscreen-message {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        @keyframes fullscreen-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FullscreenLoading;