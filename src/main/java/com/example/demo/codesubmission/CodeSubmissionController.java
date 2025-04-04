package com.example.demo.codesubmission;

import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submit-code")
public class CodeSubmissionController {
    private static final Logger logger = LoggerFactory.getLogger(CodeSubmissionController.class);

    private final CodeSubmissionService submissionService;
    private final UserRepository userRepository;

    @Autowired
    public CodeSubmissionController(CodeSubmissionService submissionService, UserRepository userRepository) {
        this.submissionService = submissionService;
        this.userRepository = userRepository;
    }

    // 제출된 코드 저장 엔드포인트
    @PostMapping
    public ResponseEntity<CodeSubmission> submitCode(@RequestBody CodeSubmission submission) {
        // 클라이언트에서 전달된 user_id를 그대로 사용 (보안 이슈가 없는 경우에 한함)
        // 만약 user_id가 없거나 유효성 검증이 필요하다면 별도로 처리해야 합니다.
        logger.info("제출 정보 수신: {}", submission);
        try {
            CodeSubmission saved = submissionService.saveSubmission(submission);
            logger.info("ID: {}로 제출 정보 저장됨", saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("제출 정보 저장 중 오류 발생", e);
            return ResponseEntity.status(500).build();
        }
    }

    // 특정 사용자(userId)의 제출 내역 조회 엔드포인트
    @GetMapping("/{userId}")
    public ResponseEntity<List<CodeSubmission>> getUserSubmissions(@PathVariable Long userId) {
        List<CodeSubmission> submissions = submissionService.getSubmissionsByUserId(userId);
        return ResponseEntity.ok(submissions);
    }
}
