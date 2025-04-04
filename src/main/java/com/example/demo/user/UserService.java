package com.example.demo.user;

import com.example.demo.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    // JwtTokenProvider 제거: private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void signUp(UserDto.SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .build();

        userRepository.save(user);
    }

    @Transactional
    public UserDto.LoginResponse login(UserDto.LoginRequest request) {
        // 인증 시도
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // UserDetails 객체 가져오기
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        // 사용자 정보 조회
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
        
        // JWT 토큰 생성 로직 제거 - 필요한 경우 토큰 없이 로그인 성공 메시지 또는 사용자 정보만 반환합니다.
        return UserDto.LoginResponse.builder()
            .token("NO_TOKEN")  // 토큰 없이 처리하거나, 해당 필드를 아예 제거하세요.
            .name(user.getName())
            .build();
    }
}
