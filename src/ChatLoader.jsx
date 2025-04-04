import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * 타이핑 효과를 위한 컴포넌트
 * @param {string} text - 표시할 텍스트
 * @param {number} speed - 타이핑 속도 (ms)
 * @param {function} onComplete - 타이핑 완료 후 호출할 콜백 함수
 */
export const TypeWriter = ({ text, speed = 5, onComplete = () => {} }) => {
    const [displayText, setDisplayText] = useState('');
    const words = text.split(' ');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDone, setIsDone] = useState(false);
    
    useEffect(() => {
      if (wordIndex < words.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + (wordIndex > 0 ? ' ' : '') + words[wordIndex]);
          setWordIndex(prev => prev + 1);
        }, speed * 5); // 단어 단위이므로 속도를 조정
        
        return () => clearTimeout(timer);
      } else if (!isDone) {
        setIsDone(true);
        onComplete();
      }
    }, [wordIndex, words, speed, isDone, onComplete]);
    
    return <ReactMarkdown>{displayText}</ReactMarkdown>;
  };
/**
 * 타이핑 로딩 애니메이션 컴포넌트
 * @param {string} color - 점 색상
 * @param {string} fontSize - 폰트 크기
 */
export const TypingLoader = ({ color = '#333', fontSize = '1.5rem' }) => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span 
      style={{ 
        color: color, 
        fontSize: fontSize, 
        display: 'inline-block', 
        width: fontSize === '1rem' ? '30px' : '45px',
        textAlign: 'left',
        marginLeft: '5px' 
      }}
    >
      {dots}
    </span>
  );
};