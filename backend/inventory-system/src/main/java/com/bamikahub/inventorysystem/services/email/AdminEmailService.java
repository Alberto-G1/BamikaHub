package com.bamikahub.inventorysystem.services.email;

import com.bamikahub.inventorysystem.dao.email.EmailMessageRepository;
import com.bamikahub.inventorysystem.dao.email.EmailRecipientLogRepository;
import com.bamikahub.inventorysystem.dao.email.EmailTemplateRepository;
import com.bamikahub.inventorysystem.dto.email.SendCustomEmailRequest;
import com.bamikahub.inventorysystem.dto.email.SendCustomEmailResponse;
import com.bamikahub.inventorysystem.models.email.EmailMessage;
import com.bamikahub.inventorysystem.models.email.EmailRecipientLog;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import com.bamikahub.inventorysystem.services.notification.NotificationService;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminEmailService {

    private final UserRepository userRepository;
    private final com.bamikahub.inventorysystem.services.email.EmailService emailService;
    private final EmailMessageRepository emailMessageRepository;
    private final EmailRecipientLogRepository emailRecipientLogRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Value("${notifications.mail.from:no-reply@bamikahub.com}")
    private String defaultFrom;

    @Transactional
    public SendCustomEmailResponse sendCustomEmail(Long actorId, SendCustomEmailRequest request) {
        // Rate limit per actor check
        if (actorId != null && !isWithinRateLimit(actorId)) {
            throw new RuntimeException("Email rate limit exceeded for user " + actorId);
        }
        // Build recipient list
        Set<User> recipients = new HashSet<>();
        if (request.getUserIds() != null) {
            recipients.addAll(userRepository.findAllById(request.getUserIds()));
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            recipients.addAll(userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && request.getRoles().contains(u.getRole().getName()))
                    .collect(Collectors.toList()));
        }
        if (request.getDepartments() != null && !request.getDepartments().isEmpty()) {
            recipients.addAll(userRepository.findAll().stream()
                    .filter(u -> u.getDepartment() != null && request.getDepartments().contains(u.getDepartment()))
                    .collect(Collectors.toList()));
        }

        // Also include explicit emails (non-users)
        List<String> freeformEmails = Optional.ofNullable(request.getEmails()).orElse(Collections.emptyList());

        // Create EmailMessage record
        User actorUser = null;
        if (actorId != null) {
            actorUser = userRepository.findById(actorId).orElse(null);
        }

        EmailMessage message = EmailMessage.builder()
                .subject(request.getSubject())
                .body(request.getBody())
                .createdAt(LocalDateTime.now())
            .recipientsCsv(buildRecipientsCsv(recipients, freeformEmails))
            .createdBy(actorUser)
            .attachmentPaths(request.getAttachmentPaths() != null ? String.join(",", request.getAttachmentPaths()) : null)
                .build();
        message = emailMessageRepository.save(message);

        Map<String, String> statuses = new HashMap<>();

        // Ensure we create recipient logs
        List<EmailRecipientLog> logs = new ArrayList<>();
        for (User user : recipients) {
            EmailRecipientLog recipientLog = EmailRecipientLog.builder()
                .emailMessage(message)
                .recipient(user)
                .recipientEmail(user.getEmail())
                .status(EmailRecipientLog.Status.PENDING)
                .build();
            logs.add(recipientLog);
        }
        for (String email : freeformEmails) {
            EmailRecipientLog recipientLog = EmailRecipientLog.builder()
                .emailMessage(message)
                .recipient(null)
                .recipientEmail(email)
                .status(EmailRecipientLog.Status.PENDING)
                .build();
            logs.add(recipientLog);
        }
        emailRecipientLogRepository.saveAll(logs);

        // Send emails and update logs
        for (EmailRecipientLog recipientLog : logs) {
            try {
            String to = recipientLog.getRecipientEmail();
                // If template id provided, use it and send via EmailService; otherwise send custom body
                if (request.getTemplateId() != null) {
                    // load template name
                    var template = emailTemplateRepository.findById(request.getTemplateId()).orElse(null);
                    if (template != null) {
                        emailService.sendEmailFromTemplateWithPaths(
                                List.of(to), template.getName(), Optional.ofNullable(request.getTemplateVars()).orElse(Map.of()),
                                request.getAttachmentPaths());
                    } else {
                        // fallback to send custom body
                        emailService.sendCustomEmailWithPaths(List.of(to), request.getSubject(), request.getBody(), request.getAttachmentPaths());
                    }
                } else {
                    emailService.sendCustomEmailWithPaths(List.of(to), request.getSubject(), request.getBody(), request.getAttachmentPaths());
                }

                recipientLog.setStatus(EmailRecipientLog.Status.SENT);
                recipientLog.setAttemptedAt(LocalDateTime.now());
                emailRecipientLogRepository.save(recipientLog);
                statuses.put(to, "SENT");
                if (request.isSendInAppNotification() && recipientLog.getRecipient() != null) {
                    // create in-app notification for recipient
                    notificationService.notifyUser(recipientLog.getRecipient().getId(), NotificationType.MENTION,
                            "Admin message: " + message.getSubject(), message.getSubject(), null);
                }
                // Audit successful send
                auditService.logAction(actorUser, com.bamikahub.inventorysystem.models.audit.AuditLog.ActionType.NOTIFICATION_SENT,
                    "AdminEmail", message.getId(), message.getSubject(), "Sent email to " + to);
            } catch (Exception ex) {
                log.error("Failed to send custom email to {}: {}", recipientLog.getRecipientEmail(), ex.getMessage());
                recipientLog.setStatus(EmailRecipientLog.Status.FAILED);
                recipientLog.setAttemptedAt(LocalDateTime.now());
                recipientLog.setErrorMessage(ex.getMessage());
                emailRecipientLogRepository.save(recipientLog);
                statuses.put(recipientLog.getRecipientEmail(), "FAILED: " + ex.getMessage());
                // Audit failed send
                auditService.logAction(actorUser, com.bamikahub.inventorysystem.models.audit.AuditLog.ActionType.NOTIFICATION_SENT,
                    "AdminEmail", message.getId(), message.getSubject(), "Failed to send email to " + recipientLog.getRecipientEmail());
            }
        }

        SendCustomEmailResponse response = new SendCustomEmailResponse();
        response.setMessageId(message.getId());
        response.setDeliveryStatuses(statuses);

        return response;
    }

    private String buildRecipientsCsv(Set<User> users, List<String> bs) {
        List<String> items = users.stream().map(User::getEmail).collect(Collectors.toList());
        items.addAll(bs);
        return String.join(",", items);
    }

    private final int HOUR_LIMIT = 200;

    private boolean isWithinRateLimit(Long actorId) {
        if (actorId == null) return true;
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long count = emailMessageRepository.countByCreatedByIdAndCreatedAtAfter(actorId, oneHourAgo);
        return count < HOUR_LIMIT;
    }
}
