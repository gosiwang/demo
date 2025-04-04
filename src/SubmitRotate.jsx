import React from 'react';

/**
 * 코드 제출 중 로딩 애니메이션 컴포넌트
 * @param {boolean} isLoading - 로딩 상태
 * @param {string} color - 애니메이션 색상 (기본값: '#ffffff')
 * @param {string} size - 애니메이션 크기 (기본값: '24px')
 */
export const SubmitLoadingSpinner = ({ isLoading, color = '#ffffff', size = '24px' }) => {
  if (!isLoading) return null;
  
  return (
    <div className="spinner-container" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="submit-spinner"
        style={{
          width: size,
          height: size,
          border: `3px solid rgba(255, 255, 255, 0.3)`,
          borderRadius: '50%',
          borderTop: `3px solid ${color}`,
          animation: 'spin 1s linear infinite',
          marginRight: '8px'
        }}
      ></div>
      <span style={{ marginLeft: '8px', color: color }}>채점 중...</span>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * 코드 제출 버튼 컴포넌트 (로딩 상태 포함)
 * @param {Function} onClick - 클릭 핸들러
 * @param {boolean} isLoading - 로딩 상태
 * @param {string} text - 버튼 텍스트
 * @param {string} loadingText - 로딩 중 텍스트
 * @param {object} style - 추가 스타일
 */
export const SubmitButton = ({ onClick, isLoading, text = "제출", loadingText = "채점 중", style = {} }) => {
  return (
    <button
      onClick={isLoading ? null : onClick}
      className="button-3d submit-button"
      disabled={isLoading}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        background: isLoading ? "#34a853" : "#28a745",
        color: "white",
        border: "none",
        cursor: isLoading ? "wait" : "pointer",
        fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "100px",
        ...style
      }}
    >
      {isLoading ? (
        <SubmitLoadingSpinner isLoading={true} color="#ffffff" size="20px" />
      ) : (
        text
      )}
    </button>
  );
};