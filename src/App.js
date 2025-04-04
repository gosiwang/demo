// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import LoginModal from './LoginModal';
import MainPage from './MainPage'; 
import LearnPage from './LearnPage';
import PerformanceVisualizations from './PerformanceVisualizations';

const AppContent = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      {/* 공통 컴포넌트 */}
      <LoginModal />
      <Sidebar />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="content-container" style={{
        marginTop: '70px', // 헤더 높이만큼 여백
        transition: 'margin-left 0.3s ease',
        minHeight: 'calc(100vh - 70px)'
      }}>
        <Routes>
          {/* 메인 페이지를 루트 경로로 설정 */}
          <Route path="/" element={<MainPage />} />
          <Route path="/learn" element={<LearnPage />} />
          {/* 기타 라우트: 404 페이지 또는 기본 리디렉션 */}
          <Route path="*" element={<MainPage />} />
        </Routes>
      </div>

      {/* 경로가 "/"일 때만 성능 시각화 영역 표시 */}
      {location.pathname === "/" && <PerformanceVisualizations />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
