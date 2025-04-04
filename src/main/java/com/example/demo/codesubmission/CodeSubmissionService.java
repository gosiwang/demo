package com.example.demo.codesubmission;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CodeSubmissionService {

    private final CodeSubmissionRepository repository;

    @Autowired
    public CodeSubmissionService(CodeSubmissionRepository repository) {
        this.repository = repository;
    }

    // 제출 코드 저장
    public CodeSubmission saveSubmission(CodeSubmission submission) {
        return repository.save(submission);
    }

    // 특정 사용자(userId)의 제출 내역 조회
    public List<CodeSubmission> getSubmissionsByUserId(Long userId) {
        return repository.findByUserId(userId);
    }
}
