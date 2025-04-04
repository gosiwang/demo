// MainPage.jsx - 통합 버전
import React, { useState, useEffect } from 'react';
import slide1 from './slide1.png';
import slide2 from './slide2.png';
import slide3 from './slide3.png';
import slide4 from './slide4.png';

const MainPage = () => {
  // 자동 슬라이드를 위한 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 이미지 배열
  const images = [slide1, slide2, slide3, slide4];
  
  // 자동 슬라이드 타이머 (메인 페이지)
  useEffect(() => {
    let intervalId;
    
    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlaying, images.length]);
  
  // 슬라이드 이동 함수
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  // 재생/일시정지 토글 함수
  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };
  
  // 모달 열기/닫기 함수
  const closeModal = () => setIsModalOpen(false);
  
  return (
    <div style={{
      paddingTop: '100px',
      textAlign: 'center',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '1.5rem',
        color: '#333'
      }}>코드스쿨러에 오신 것을 환영합니다</h1>
      
      <p style={{
        fontSize: '1.2rem',
        marginBottom: '2rem',
        color: '#666'
      }}>
        프로그래밍 학습과 커뮤니티를 통해 개발 실력을 향상시키세요.
      </p>

      {/* 메인 페이지 이미지 슬라이더 */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '400px',
        margin: '0 auto 20px auto',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {/* 단일 이미지만 표시 */}
        <img 
          src={images[currentIndex]} 
          alt={`슬라이드 ${currentIndex + 1}`} 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
        
        {/* 인디케이터 점들 */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          zIndex: '10'
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#00e5ff' : '#ccc',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
        
        {/* 슬라이드 번호 및 컨트롤 */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          
          <button
            onClick={toggleAutoPlay}
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isAutoPlaying ? "⏸" : "▶"}
          </button>
        </div>
      </div>
      
      {/* 메인 페이지 버튼 영역 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '40px'
      }}>
      </div>
      
      {/* 전체 화면 모달 (원래 ImageSliderModal의 기능) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '1200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            
            {/* 모달 내 이미지 */}
            <div style={{
              position: 'relative',
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={images[currentIndex]}
                alt={`슬라이드 ${currentIndex + 1}`}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {/* 모달 내 인디케이터 */}
              <div style={{
                position: 'absolute',
                bottom: '30px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: '12px'
              }}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: index === currentIndex ? '#00e5ff' : '#ccc',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label={`슬라이드 ${index + 1}로 이동`}
                  />
                ))}
              </div>
            </div>
            
            {/* 모달 내 컨트롤 영역 */}
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #eee'
            }}>
              <div style={{color: '#666', fontSize: '14px'}}>
                {currentIndex + 1} / {images.length}
              </div>
              
              <button
                onClick={toggleAutoPlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isAutoPlaying ? '#f0f0f0' : '#00e5ff',
                  color: isAutoPlaying ? '#333' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                <span>{isAutoPlaying ? "일시정지" : "재생"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;