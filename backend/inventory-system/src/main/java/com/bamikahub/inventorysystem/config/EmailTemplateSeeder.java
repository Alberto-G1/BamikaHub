package com.bamikahub.inventorysystem.config;

import com.bamikahub.inventorysystem.dao.email.EmailTemplateRepository;
import com.bamikahub.inventorysystem.models.email.EmailTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateSeeder implements CommandLineRunner {

    private final EmailTemplateRepository templateRepository;

    @Override
    public void run(String... args) throws Exception {
        seedIfMissing();
    }

    private void seedIfMissing() {
        // Define templates to ensure present
        List<TemplateFile> templates = List.of(
                new TemplateFile("welcome", "Welcome to BamikaHub", "email/welcome.html"),
                new TemplateFile("password-reset", "Reset your password", "email/password-reset.html"),
                new TemplateFile("ticket-assigned", "Support ticket assigned", "email/ticket-assigned.html"),
                new TemplateFile("ticket-resolved", "Your ticket has been resolved", "email/ticket-resolved.html"),
                new TemplateFile("newsletter", "BamikaHub Newsletter", "email/newsletter.html"),
                new TemplateFile("user-invite", "You're invited to BamikaHub", "email/user-invite.html"),
                new TemplateFile("general-notification", "Notification from BamikaHub", "email/general-notification.html")
        );

        for (TemplateFile tf : templates) {
            if (templateRepository.findByName(tf.name).isEmpty()) {
                try {
                    String body = loadResourceAsString(tf.resourcePath);
                    EmailTemplate t = EmailTemplate.builder()
                            .name(tf.name)
                            .subject(tf.subject)
                            .body(body)
                            .build();
                    templateRepository.save(t);
                    log.info("Seeded email template {}", tf.name);
                } catch (Exception e) {
                    log.warn("Failed to load template {}: {}", tf.resourcePath, e.getMessage());
                }
            }
        }
    }

    private String loadResourceAsString(String resourcePath) throws IOException {
        ClassPathResource res = new ClassPathResource("templates/" + resourcePath);
        try (var is = res.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static class TemplateFile {
        final String name;
        final String subject;
        final String resourcePath;

        TemplateFile(String name, String subject, String resourcePath) {
            this.name = name;
            this.subject = subject;
            this.resourcePath = resourcePath;
        }
    }
}
