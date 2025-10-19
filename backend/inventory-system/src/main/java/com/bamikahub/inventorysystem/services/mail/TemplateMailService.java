package com.bamikahub.inventorysystem.services.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
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
            builder.append("<p>").append(variables.getOrDefault("message", "")).append("</p>");
            builder.append("<p>Ticket #").append(variables.getOrDefault("ticketId", ""))
                    .append(" - ").append(variables.getOrDefault("ticketSubject", ""))
                    .append("</p>");
            builder.append("<p>Status: ").append(variables.getOrDefault("ticketStatus", "")).append("</p>");
            builder.append("<p>").append(variables.getOrDefault("slaSummary", "")).append("</p>");
            helper.setText(builder.toString(), true);

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email notification", e);
        }
    }
}
