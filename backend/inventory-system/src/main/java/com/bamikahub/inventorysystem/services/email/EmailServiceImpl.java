package com.bamikahub.inventorysystem.services.email;

import com.bamikahub.inventorysystem.dao.email.EmailLogRepository;
import com.bamikahub.inventorysystem.dao.email.EmailTemplateRepository;
import com.bamikahub.inventorysystem.models.email.EmailLog;
import com.bamikahub.inventorysystem.models.email.EmailStatus;
import com.bamikahub.inventorysystem.models.email.EmailTemplate;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final EmailLogRepository emailLogRepository;
    private final EmailTemplateRepository emailTemplateRepository;

    @Override
    public void sendCustomEmail(List<String> to, String subject, String body, List<MultipartFile> attachments) {
        // For custom emails, we can still use a generic template for consistent branding
        Context context = new Context();
        context.setVariable("body", body);
        String htmlBody = templateEngine.process("email/generic-template", context);
        sendEmail(to, subject, htmlBody, attachments);
    }

    @Override
    public void sendCustomEmailWithPaths(List<String> to, String subject, String body, List<String> attachmentPaths) {
        sendEmailWithPaths(to, subject, body, attachmentPaths);
    }

    @Override
    public void sendEmailFromTemplate(List<String> to, String templateName, Map<String, Object> variables, List<MultipartFile> attachments) {
        EmailTemplate template = emailTemplateRepository.findByName(templateName)
                .orElseThrow(() -> new RuntimeException("Email template not found: " + templateName));

        Context context = new Context();
        context.setVariables(variables);
        String htmlBody = processStringTemplate(template.getBody(), context);
        sendEmail(to, template.getSubject(), htmlBody, attachments);
    }

    @Override
    public void sendEmailFromTemplateWithPaths(List<String> to, String templateName, Map<String, Object> variables, List<String> attachmentPaths) {
        EmailTemplate template = emailTemplateRepository.findByName(templateName)
                .orElseThrow(() -> new RuntimeException("Email template not found: " + templateName));

        Context context = new Context();
        context.setVariables(variables != null ? variables : Map.of());
        String htmlBody = processStringTemplate(template.getBody(), context);
        sendEmailWithPaths(to, template.getSubject(), htmlBody, attachmentPaths);
    }

    private void sendEmail(List<String> to, String subject, String htmlBody, List<MultipartFile> attachments) {
        EmailLog emailLog = new EmailLog();
        emailLog.setRecipients(String.join(",", to));
        emailLog.setSubject(subject);
        emailLog.setBody(htmlBody);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            helper.setTo(to.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            if (attachments != null) {
                for (MultipartFile attachment : attachments) {
                    helper.addAttachment(attachment.getOriginalFilename(), attachment);
                }
            }

            mailSender.send(mimeMessage);
            emailLog.setStatus(EmailStatus.SENT);
            log.info("Email sent successfully to {}", to);

        } catch (MessagingException e) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send email", e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        } finally {
            emailLogRepository.save(emailLog);
        }
    }

    // New helper to handle attachments by filesystem paths
    private void sendEmailWithPaths(List<String> to, String subject, String htmlBody, List<String> attachmentPaths) {
        EmailLog emailLog = new EmailLog();
        emailLog.setRecipients(String.join(",", to));
        emailLog.setSubject(subject);
        emailLog.setBody(htmlBody);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            helper.setTo(to.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            if (attachmentPaths != null) {
                for (String path : attachmentPaths) {
                    java.nio.file.Path p = java.nio.file.Paths.get(path.startsWith("/") ? path.substring(1) : path);
                    FileSystemResource resource = new FileSystemResource(p.toFile());
                    helper.addAttachment(resource.getFilename(), resource);
                }
            }

            mailSender.send(mimeMessage);
            emailLog.setStatus(EmailStatus.SENT);
            log.info("Email sent successfully to {}", to);

        } catch (MessagingException e) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send email", e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        } finally {
            emailLogRepository.save(emailLog);
        }
    }

    // Template Management Methods
    @Override
    public EmailTemplate createTemplate(EmailTemplate template) {
        // Here you could add logic to set the 'createdBy' user
        return emailTemplateRepository.save(template);
    }

    @Override
    public EmailTemplate getTemplateById(Long id) {
        return emailTemplateRepository.findById(id).orElseThrow(() -> new RuntimeException("Template not found"));
    }

    @Override
    public List<EmailTemplate> getAllTemplates() {
        return emailTemplateRepository.findAll();
    }

    @Override
    public EmailTemplate updateTemplate(Long id, EmailTemplate templateDetails) {
        EmailTemplate existingTemplate = getTemplateById(id);
        existingTemplate.setName(templateDetails.getName());
        existingTemplate.setSubject(templateDetails.getSubject());
        existingTemplate.setBody(templateDetails.getBody());
        // Here you could add logic to set the 'updatedBy' user
        return emailTemplateRepository.save(existingTemplate);
    }

    @Override
    public void deleteTemplate(Long id) {
        emailTemplateRepository.deleteById(id);
    }

    private String processStringTemplate(String templateContent, Context context) {
        TemplateEngine stringEngine = new TemplateEngine();
        StringTemplateResolver resolver = new StringTemplateResolver();
        stringEngine.setTemplateResolver(resolver);
        return stringEngine.process(templateContent, context);
    }
}
