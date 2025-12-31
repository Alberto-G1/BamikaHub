package com.bamikahub.inventorysystem.services.notification;

import com.bamikahub.inventorysystem.models.notification.Notification;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

/**
 * Service for sending email notifications
 * Uses Spring Mail and Thymeleaf templates
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    
    @Value("${spring.mail.username:noreply@bamikahub.com}")
    private String fromEmail;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    @Value("${app.company.name:Bamika Engineering}")
    private String companyName;
    
    /**
     * Send notification email
     */
    @Async
    public void sendNotificationEmail(User recipient, Notification notification) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, companyName);
            helper.setTo(recipient.getEmail());
            helper.setSubject(notification.getTitle());
            
            // Build email body from template
            String htmlContent = buildEmailContent(recipient, notification);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            
            log.info("Sent email notification to {}: {}", recipient.getEmail(), notification.getTitle());
            
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", recipient.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Email sending failed", e);
        }
    }
    
    /**
     * Build HTML email content using Thymeleaf template
     */
    private String buildEmailContent(User recipient, Notification notification) {
        Context context = new Context();
        
        // Add common variables
        context.setVariable("recipientName", recipient.getFirstName());
        context.setVariable("title", notification.getTitle());
        context.setVariable("message", notification.getMessage());
        context.setVariable("notificationType", notification.getType().getDisplayName());
        context.setVariable("priority", notification.getPriority().name());
        context.setVariable("companyName", companyName);
        context.setVariable("currentYear", java.time.Year.now().getValue());
        
        // Add link if available
        if (notification.getLink() != null && !notification.getLink().isEmpty()) {
            String fullLink = frontendUrl + notification.getLink();
            context.setVariable("actionLink", fullLink);
            context.setVariable("hasLink", true);
        } else {
            context.setVariable("hasLink", false);
        }
        
        // Add triggered by info
        if (notification.getTriggeredBy() != null) {
            context.setVariable("triggeredBy", 
                notification.getTriggeredBy().getFirstName() + " " + 
                notification.getTriggeredBy().getLastName());
            context.setVariable("hasTriggeredBy", true);
        } else {
            context.setVariable("hasTriggeredBy", false);
        }
        
        // Add timestamp
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        context.setVariable("timestamp", notification.getCreatedAt().format(formatter));
        
        // Use specific template based on notification type
        String templateName = getTemplateName(notification);
        
        return templateEngine.process(templateName, context);
    }
    
    /**
     * Determine which email template to use
     */
    private String getTemplateName(Notification notification) {
        switch (notification.getType()) {
            case REQUISITION_APPROVED:
            case REQUISITION_REJECTED:
            case REQUISITION_FULFILLED:
                return "emails/requisition-notification";
                
            case TICKET_ASSIGNED:
            case TICKET_RESOLVED:
            case TICKET_CLOSED:
            case TICKET_SLA_WARNING:
            case TICKET_SLA_BREACH:
                return "emails/ticket-notification";
                
            case PROJECT_ASSIGNED:
            case PROJECT_COMPLETED:
            case PROJECT_STATUS_CHANGED:
                return "emails/project-notification";
                
            case USER_APPROVED:
            case USER_REJECTED:
            case USER_ROLE_CHANGED:
                return "emails/user-notification";
                
            default:
                return "emails/generic-notification";
        }
    }
    
    /**
     * Send welcome email to new user (admin created or approved)
     */
    @Async
    public void sendWelcomeEmail(User user, boolean isApproved) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, companyName);
            helper.setTo(user.getEmail());
            helper.setSubject("🎉 Welcome to BamikaHub!");
            
            Context context = new Context();
            context.setVariable("firstName", user.getFirstName());
            context.setVariable("fullName", user.getFullName());
            context.setVariable("username", user.getUsername());
            context.setVariable("email", user.getEmail());
            context.setVariable("roleName", user.getRole() != null ? user.getRole().getName() : "User");
            context.setVariable("isApproved", isApproved);
            context.setVariable("loginUrl", frontendUrl + "/login");
            context.setVariable("frontendUrl", frontendUrl);
            context.setVariable("currentYear", java.time.Year.now().getValue());
            
            String htmlContent = templateEngine.process("email/welcome-user", context);
            helper.setText(htmlContent, true);
            
            // Embed logo as inline image
            try {
                org.springframework.core.io.ClassPathResource logoResource = 
                    new org.springframework.core.io.ClassPathResource("static/logo.png");
                if (logoResource.exists()) {
                    helper.addInline("logo", logoResource);
                }
            } catch (Exception logoEx) {
                log.warn("Could not embed logo in welcome email: {}", logoEx.getMessage());
            }
            
            mailSender.send(message);
            
            log.info("Sent welcome email to {} (approved: {})", user.getEmail(), isApproved);
            
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }
    
    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, companyName);
            helper.setTo(user.getEmail());
            helper.setSubject("Password Reset Request");
            
            Context context = new Context();
            context.setVariable("userName", user.getFirstName());
            context.setVariable("resetLink", frontendUrl + "/reset-password?token=" + resetToken);
            context.setVariable("companyName", companyName);
            context.setVariable("currentYear", java.time.Year.now().getValue());
            
            String htmlContent = templateEngine.process("emails/password-reset", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            
            log.info("Sent password reset email to {}", user.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
