import React, { useState, useEffect } from 'react';
import { Home, BookOpen, MessageCircle, Settings, Menu } from 'lucide-react';

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: '-240px',
    height: '100vh',
    width: '240px',
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    backdropFilter: 'blur(8px)',
    transition: 'left 0.3s ease',
    paddingTop: '20px',
    zIndex: 1000,
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
    boxSizing: 'border-box',
  },
  sidebarVisible: {
    left: 0,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: '#ffffff',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    margin: '0 8px 4px 8px',
  },
  menuItemHover: {
    backgroundColor: '#000000',
    color: '#ffffff',
    transform: 'translateX(5px)',
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
  },
  iconContainerHover: {
    transform: 'scale(1.1)',
  },
  menuText: {
    marginLeft: '12px',
    whiteSpace: 'nowrap',
    fontWeight: '500',
  },
  logo: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 0 25px 0',
    padding: '0',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '200px',
    maxWidth: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '10px 15px 20px 15px',
  },
  // 중앙 상단 버튼 관련 (모던하게 재설계)
  centerTopBar: {
    position: 'fixed',
    top: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '20px',
    zIndex: 1100,
    alignItems: 'center',
  },
  centerTopButton: {
    background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background 0.3s ease, transform 0.3s ease',
    fontSize: '18px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  centerTopButtonHover: {
    background: 'linear-gradient(135deg, #357ABD, #2D6AA8)',
    transform: 'scale(1.05)',
  },
};

const menuItems = [
  { icon: Home, text: '홈', path: '/' },
  { icon: BookOpen, text: '학습하기', path: '/learn' },
  { icon: MessageCircle, text: '커뮤니티', path: '/qna' },
  { icon: Settings, text: '설정', path: '/settings' }
];

const Sidebar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredCenterButton, setHoveredCenterButton] = useState(null);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  // 메뉴 아이템 호버 효과
  const handleMouseEnter = (index) => {
    setHoveredItem(index);
  };
  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // 페이지 이동 함수
  const handleNavigation = (e, path) => {
    e.preventDefault();
    window.location.href = path;
  };

  // 메인 콘텐츠 이동 효과 + 로고 & 햄버거 버튼 이동
  useEffect(() => {
    const content = document.getElementById('root') || document.body;
    if (isVisible) {
      content.style.marginLeft = '240px';
      content.style.width = 'calc(100% - 240px)';
    } else {
      content.style.marginLeft = '0';
      content.style.width = '100%';
    }
    content.style.transition = 'margin-left 0.3s ease, width 0.3s ease';

    const logoEl = document.getElementById('appLogo');
    if (logoEl) {
      if (isVisible) {
        logoEl.style.left = '360px'; // 120 + 240
      } else {
        logoEl.style.left = '120px';
      }
      logoEl.style.transition = 'left 0.3s ease';
    }

    const hamburgerEl = document.getElementById('hamburgerButton');
    if (hamburgerEl) {
      if (isVisible) {
        hamburgerEl.style.left = '270px'; // 30 + 240
      } else {
        hamburgerEl.style.left = '30px';
      }
      hamburgerEl.style.transition = 'left 0.3s ease';
    }

    return () => {
      content.style.marginLeft = '';
      content.style.width = '';
      content.style.transition = '';

      if (logoEl) {
        logoEl.style.left = '120px';
        logoEl.style.transition = '';
      }
      if (hamburgerEl) {
        hamburgerEl.style.left = '30px';
        hamburgerEl.style.transition = '';
      }
    };
  }, [isVisible]);

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <div
        id="hamburgerButton"
        style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          padding: '20px',
          cursor: 'pointer',
          zIndex: 1001,
          color: '#333',
        }}
        onClick={toggleSidebar}
      >
        <Menu size={36} />
      </div>

      {/* 중앙 상단 버튼 (모던하게 재설계) */}
      <div style={styles.centerTopBar}>
        <a
          href="/learn"
          onClick={(e) => handleNavigation(e, '/learn')}
          style={{
            ...styles.centerTopButton,
            ...(hoveredCenterButton === 'learn' ? styles.centerTopButtonHover : {})
          }}
          onMouseEnter={() => setHoveredCenterButton('learn')}
          onMouseLeave={() => setHoveredCenterButton(null)}
        >
          학습하기
        </a>
        <a
          href="/qna"
          onClick={(e) => handleNavigation(e, '/qna')}
          style={{
            ...styles.centerTopButton,
            ...(hoveredCenterButton === 'qna' ? styles.centerTopButtonHover : {})
          }}
          onMouseEnter={() => setHoveredCenterButton('qna')}
          onMouseLeave={() => setHoveredCenterButton(null)}
        >
          커뮤니티
        </a>
      </div>

      {/* 사이드바 메뉴 */}
      <div
        style={{
          ...styles.sidebar,
          ...(isVisible ? styles.sidebarVisible : {})
        }}
      >
        <div style={styles.logo}>
          🏫 CodeSchooler
        </div>
        <div style={styles.divider}></div>
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.path}
            onClick={(e) => handleNavigation(e, item.path)}
            style={{
              ...styles.menuItem,
              ...(hoveredItem === index ? styles.menuItemHover : {})
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div style={{
              ...styles.iconContainer,
              ...(hoveredItem === index ? styles.iconContainerHover : {})
            }}>
              <item.icon size={20} color={hoveredItem === index ? '#ffffff' : '#cccccc'} />
            </div>
            <span style={styles.menuText}>
              {item.text}
            </span>
          </a>
        ))}
      </div>
    </>
  );
};

export { Sidebar };
