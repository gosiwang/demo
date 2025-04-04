import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const styles = {
  headerContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '60px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1005,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    transition: 'padding-left 0.3s ease',
  },
  mainContent: {
    marginTop: '70px',
    width: '100%',
    transition: 'margin-left 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    position: 'relative',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
  },
  buttonContainer: {
    position: 'fixed',
    top: '50px',
    right: '20px',
    display: 'flex',
    gap: '10px',
    zIndex: 100,
  },
  loginButton: {
    padding: '10px 16px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '500',
    transition: 'background 0.2s ease, transform 0.2s ease',
  },
  signupButton: {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#4A90E2',
    border: '1px solid #4A90E2',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '500',
    transition: 'background 0.2s ease, transform 0.2s ease',
  },
  logo: {
    position: 'fixed',
    top: '50px',
    left: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    zIndex: 100,
  },
  logoIcon: {
    color: '#4A90E2',
  },
  logoText: {
    color: '#4A90E2',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingLeft: '40px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box'
  },
  icon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '16px',
    transition: 'background 0.2s ease, transform 0.2s ease',
  },
  rememberMe: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    marginBottom: '16px',
  },
  forgotPassword: {
    color: '#4A90E2',
    textAlign: 'right',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'block',
    marginTop: '8px',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  line: {
    flex: 1,
    height: '1px',
    backgroundColor: '#eee',
  },
  orText: {
    margin: '0 10px',
    color: '#666',
    fontSize: '14px',
  },
  socialButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px',
  },
  socialButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  signupText: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '14px',
    color: '#666',
  },
  signupLink: {
    color: '#4A90E2',
    cursor: 'pointer',
    textDecoration: 'none',
    marginLeft: '4px',
  },
};

// 모달 컴포넌트 (변경 없음)
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const LoginModal = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  // userId를 state로 관리 (로그인 시 backend에서 받은 값 유지)
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || null);

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('비밀번호 찾기 기능은 준비중입니다.');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    if (token && userName) {
      setUser({ name: userName });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const rememberMe = e.target.remember.checked;

    try {
      const response = await axios.post('http://localhost:8080/api/users/login', {
        email,
        password,
        rememberMe
      });

      const { token, name, userId: receivedUserId } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userName', name);
      if (receivedUserId) {
        localStorage.setItem('user_id', receivedUserId);
        setUserId(receivedUserId);
      }
      setUser({ name });
      setLoginModalOpen(false);
    } catch (error) {
      alert('로그인에 실패했습니다.');
      console.error('Login error:', error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const passwordConfirm = e.target.passwordConfirm.value;

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/users/signup', {
        name,
        email,
        password
      });
      alert('회원가입이 완료되었습니다.');
      setSignupModalOpen(false);
      setLoginModalOpen(true);
    } catch (error) {
      alert('회원가입에 실패했습니다.');
      console.error('Signup error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('user_id');
    setUser(null);
    setUserId(null);
  };

  const LoginContent = () => (
    <>
      <h1 style={styles.title}>로그인</h1>
      <form onSubmit={handleLogin}>
        <div style={styles.inputWrapper}>
          <Mail style={styles.icon} size={20} />
          <input
            name="email"
            type="email"
            placeholder="이메일을 입력하세요"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputWrapper}>
          <Lock style={styles.icon} size={20} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 입력하세요"
            style={styles.input}
            required
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            style={{ ...styles.icon, left: 'auto', right: '12px', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>
        <div style={styles.rememberMe}>
          <input type="checkbox" id="remember" name="remember" />
          <label htmlFor="remember" style={{ fontSize: '14px' }}>로그인 유지</label>
        </div>
        <button type="submit" style={styles.submitButton}>로그인</button>
        <div style={styles.signupText}>
          계정이 없으신가요?
          <span
            style={styles.signupLink}
            onClick={() => {
              setLoginModalOpen(false);
              setSignupModalOpen(true);
            }}
          >
            회원가입
          </span>
        </div>
        <a
          href="/forgot-password"
          onClick={handleForgotPassword}
          style={styles.forgotPassword}
        >
          비밀번호 찾기
        </a>
      </form>
    </>
  );

  const SignUpContent = () => (
    <>
      <h1 style={styles.title}>회원가입</h1>
      <form onSubmit={handleSignup}>
        <div style={styles.inputWrapper}>
          <User style={styles.icon} size={20} />
          <input
            name="name"
            type="text"
            placeholder="이름을 입력하세요"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputWrapper}>
          <Mail style={styles.icon} size={20} />
          <input
            name="email"
            type="email"
            placeholder="이메일을 입력하세요"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputWrapper}>
          <Lock style={styles.icon} size={20} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 입력하세요"
            style={styles.input}
            required
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            style={{ ...styles.icon, left: 'auto', right: '12px', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>
        <div style={styles.inputWrapper}>
          <Lock style={styles.icon} size={20} />
          <input
            name="passwordConfirm"
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 다시 입력하세요"
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.submitButton}>회원가입</button>
        <div style={styles.signupText}>
          이미 계정이 있으신가요?
          <span
            style={styles.signupLink}
            onClick={() => {
              setSignupModalOpen(false);
              setLoginModalOpen(true);
            }}
          >
            로그인
          </span>
        </div>
      </form>
    </>
  );
  
  return (
    <div>
      <a
        id="appLogo"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          handleHome();
        }}
        style={styles.logo}
      >
        <span style={styles.logoText}>🧩CodeSchooler</span>
      </a>
      <div style={styles.buttonContainer}>
        {user ? (
          <>
            <span
              style={{
                ...styles.loginButton,
                backgroundColor: 'transparent',
                color: '#000000',
                cursor: 'default',
              }}
            >
              {user.name}님
            </span>
            <button
              onClick={handleLogout}
              style={{
                ...styles.signupButton,
                backgroundColor: '#357ABD',
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d6aa8')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#357ABD')}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setLoginModalOpen(true)}
              style={styles.loginButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#357ABD')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#4A90E2')}
            >
              로그인
            </button>
            <button
              onClick={() => setSignupModalOpen(true)}
              style={styles.signupButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#e6f7ff')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#fff')}
            >
              회원가입
            </button>
          </>
        )}
      </div>
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)}>
        <LoginContent />
      </Modal>
      <Modal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)}>
        <SignUpContent />
      </Modal>
    </div>
  );
};

export default LoginModal;
