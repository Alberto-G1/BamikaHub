package com.bamikahub.inventorysystem.services.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateMailService {

    private final JavaMailSender mailSender;

    public void sendTemplateMail(String from, String to, String subject, Map<String, Object> variables) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);

            StringBuilder builder = new StringBuilder();
            builder.append("<h3>").append(variables.getOrDefault("subject", "Notification")).append("</h3>");
            // Support both "message" and "body" keys for email content
            String messageContent = (String) (variables.getOrDefault("message", variables.getOrDefault("body", "")));
            builder.append("<p>").append(messageContent).append("</p>");
            builder.append("<p>Ticket #").append(variables.getOrDefault("ticketId", ""))
                    .append(" - ").append(variables.getOrDefault("ticketSubject", ""))
                    .append("</p>");
            builder.append("<p>Status: ").append(variables.getOrDefault("ticketStatus", "")).append("</p>");
            builder.append("<p>").append(variables.getOrDefault("slaSummary", "")).append("</p>");
            if (variables.containsKey("ctaUrl")) {
                String label = (String) variables.getOrDefault("ctaLabel", "Open Portal");
                builder.append("<p><a href=\"")
                        .append(variables.get("ctaUrl"))
                        .append("\" style=\"display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">")
                        .append(label)
                        .append("</a></p>");
            }
            helper.setText(builder.toString(), true);

            mailSender.send(mimeMessage);
            log.debug("Email sent to {} with subject {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {} with subject {}", to, subject, e);
            throw new RuntimeException("Failed to send email notification", e);
        }
    }
}
