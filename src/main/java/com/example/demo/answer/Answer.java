package com.example.demo.answer;

import com.example.demo.codesubmission.CodeSubmission;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 문제 번호 (예: "001")
    @Column(nullable = false, unique = true)
    @JsonProperty("problem_number")
    private String problemNumber;

    // Gemini가 생성한 정답 코드
    @Column(nullable = false, columnDefinition = "TEXT")
    @JsonProperty("answer_code")
    private String answerCode;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Answer 하나에 여러 CodeSubmission이 있을 수 있음
    @OneToMany(mappedBy = "answer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CodeSubmission> submissions;
}
