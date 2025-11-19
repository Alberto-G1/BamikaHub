package com.bamikahub.inventorysystem.services.email;

import com.bamikahub.inventorysystem.models.email.EmailTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface EmailService {

    void sendCustomEmail(List<String> to, String subject, String body, List<MultipartFile> attachments);
    void sendCustomEmailWithPaths(List<String> to, String subject, String body, List<String> attachmentPaths);

    void sendEmailFromTemplate(List<String> to, String templateName, Map<String, Object> variables, List<MultipartFile> attachments);
    void sendEmailFromTemplateWithPaths(List<String> to, String templateName, Map<String, Object> variables, List<String> attachmentPaths);

    // Template Management
    EmailTemplate createTemplate(EmailTemplate template);
    EmailTemplate getTemplateById(Long id);
    List<EmailTemplate> getAllTemplates();
    EmailTemplate updateTemplate(Long id, EmailTemplate template);
    void deleteTemplate(Long id);
}
