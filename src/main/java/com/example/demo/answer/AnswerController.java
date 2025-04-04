package com.example.demo.answer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnswerController {

    private final AnswerService answerService;

    @Autowired
    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    // POST 엔드포인트: Gemini가 생성한 정답을 저장
    @PostMapping("/save-answer")
    public ResponseEntity<Answer> createAnswer(@RequestBody Answer answer) {
        Answer saved = answerService.saveAnswer(answer);
        return ResponseEntity.ok(saved);
    }

    // GET 엔드포인트: 문제 번호로 정답 조회
    @GetMapping("/get-answer/{problemNumber}")
    public ResponseEntity<Answer> getAnswer(@PathVariable("problemNumber") String problemNumber) {
        Answer answer = answerService.getAnswerByProblemNumber(problemNumber);
        if (answer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(answer);
    }
}
