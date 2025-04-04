package com.example.demo.answer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AnswerService {

    private final AnswerRepository answerRepository;

    @Autowired
    public AnswerService(AnswerRepository answerRepository) {
        this.answerRepository = answerRepository;
    }

    // 정답 저장
    public Answer saveAnswer(Answer answer) {
        return answerRepository.save(answer);
    }

    // 문제 번호에 해당하는 정답 조회
    public Answer getAnswerByProblemNumber(String problemNumber) {
        Optional<Answer> optional = answerRepository.findByProblemNumber(problemNumber);
        return optional.orElse(null);
    }
}
