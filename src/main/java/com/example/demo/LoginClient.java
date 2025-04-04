package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

public class LoginClient {
    public static void main(String[] args) {
        RestTemplate restTemplate = new RestTemplate();
        String loginUrl = "http://localhost:8080/api/login"; // 로그인 API URL

        // 로그인 요청에 필요한 자격 증명 데이터 (필요에 따라 수정)
        Map<String, String> loginData = new HashMap<>();
        loginData.put("username", "user@example.com");
        loginData.put("password", "password123");

        // API 호출 및 응답 받기
        ResponseEntity<Map> response = restTemplate.postForEntity(loginUrl, loginData, Map.class);

        // 응답 JSON에서 토큰 추출 (예: "token" 필드에 JWT 토큰이 있다고 가정)
        String jwtToken = (String) response.getBody().get("token");

        // 콘솔에 출력
        System.out.println("JWT 토큰: " + jwtToken);
    }
}
