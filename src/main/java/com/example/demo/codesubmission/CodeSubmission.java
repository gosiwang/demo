package com.example.demo.codesubmission;

import com.example.demo.answer.Answer;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class CodeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JSON의 "user_id"를 매핑하도록 지정
    @Column(nullable = false)
    @JsonProperty("user_id")
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    // 문제 번호 (문자열)로 저장됨
    @Column(nullable = false)
    @JsonProperty("problem_number")
    private String problemNumber;

    // JSON의 "is_correct"를 매핑하도록 지정
    @Column(nullable = false)
    @JsonProperty("is_correct")
    private boolean isCorrect;

    @Column(length = 2000)
    private String feedback;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    // Answer 엔티티와 다대일 관계 설정 (문제 번호를 기준으로 매핑)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_number", referencedColumnName = "problemNumber", insertable = false, updatable = false)
    private Answer answer;
}
