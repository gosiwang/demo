package com.example.demo.answer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    Optional<Answer> findByProblemNumber(String problemNumber);
}
