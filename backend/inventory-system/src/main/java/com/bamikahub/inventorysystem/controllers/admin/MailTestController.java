package com.bamikahub.inventorysystem.controllers.admin;

import com.bamikahub.inventorysystem.services.mail.TemplateMailService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Simple endpoint to test email sending configuration during development.
 */
@RestController
@RequestMapping("/internal/admin/mail")
@RequiredArgsConstructor
@Slf4j
public class MailTestController {

    private final TemplateMailService templateMailService;
    private final MailProperties mailProperties;

    @Value("${notifications.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${notifications.mail.from:no-reply@bamikahub.com}")
    private String fromAddress;

    @PostMapping("/send-test")
    public ResponseEntity<?> sendTest(@RequestBody MailTestRequest request) {
        if (!mailEnabled) {
            return ResponseEntity.badRequest().body("Mail delivery is disabled via configuration (notifications.mail.enabled=false)");
        }
        try {
            Map<String, Object> vars = new HashMap<>();
            vars.put("subject", request.getSubject());
            vars.put("message", request.getMessage());
            templateMailService.sendTemplateMail(fromAddress, request.getTo(), request.getSubject(), vars);
            String configuredHost = mailProperties.getHost();
            Integer port = mailProperties.getPort();
            return ResponseEntity.ok().body("Test email sent to " + request.getTo() + ". Using host=" + configuredHost + ", port=" + port);
        } catch (Exception e) {
            log.error("Failed to send test email to {}: {}", request.getTo(), e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to send test email: " + e.getMessage());
        }
    }

    @Data
    @AllArgsConstructor
    public static class MailTestRequest {
        private String to;
        private String subject;
        private String message;
    }
}
