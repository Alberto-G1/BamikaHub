package com.bamikahub.inventorysystem.controllers.admin;

import com.bamikahub.inventorysystem.dao.email.EmailMessageRepository;
import com.bamikahub.inventorysystem.dao.email.EmailRecipientLogRepository;
import com.bamikahub.inventorysystem.dto.email.EmailMessageDto;
import com.bamikahub.inventorysystem.dto.email.EmailRecipientLogDto;
import com.bamikahub.inventorysystem.models.email.EmailMessage;
import com.bamikahub.inventorysystem.models.email.EmailRecipientLog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/admin/email/messages")
@RequiredArgsConstructor
public class AdminEmailLogController {
    private final EmailMessageRepository messageRepository;
    private final EmailRecipientLogRepository logRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('EMAIL_VIEW_LOGS')")
    public ResponseEntity<List<EmailMessageDto>> listMessages(@RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "20") int size) {
        Page<EmailMessage> result = messageRepository.findAll(PageRequest.of(page, size));
        List<EmailMessageDto> dto = result.stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMAIL_VIEW_LOGS')")
    public ResponseEntity<EmailMessageDto> getMessage(@PathVariable Long id) {
        EmailMessage m = messageRepository.findById(id).orElseThrow(() -> new RuntimeException("Message not found"));
        return ResponseEntity.ok(toDto(m));
    }

    @GetMapping("/{id}/recipients")
    @PreAuthorize("hasAuthority('EMAIL_VIEW_LOGS')")
    public ResponseEntity<List<EmailRecipientLogDto>> getRecipients(@PathVariable Long id) {
        List<EmailRecipientLog> logs = logRepository.findByEmailMessageId(id);
        List<EmailRecipientLogDto> dto = logs.stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    private EmailMessageDto toDto(EmailMessage m) {
        EmailMessageDto d = new EmailMessageDto();
        d.setId(m.getId());
        d.setSubject(m.getSubject());
        d.setBody(m.getBody());
        d.setRecipientsCsv(m.getRecipientsCsv());
        d.setAttachmentPaths(m.getAttachmentPaths());
        d.setCreatedAt(m.getCreatedAt());
        d.setCreatedById(m.getCreatedBy() != null ? m.getCreatedBy().getId() : null);
        return d;
    }

    private EmailRecipientLogDto toDto(EmailRecipientLog l) {
        EmailRecipientLogDto d = new EmailRecipientLogDto();
        d.setId(l.getId());
        d.setMessageId(l.getEmailMessage() != null ? l.getEmailMessage().getId() : null);
        d.setRecipientId(l.getRecipient() != null ? l.getRecipient().getId() : null);
        d.setRecipientEmail(l.getRecipientEmail());
        d.setStatus(l.getStatus() != null ? l.getStatus().name() : null);
        d.setAttemptedAt(l.getAttemptedAt());
        d.setErrorMessage(l.getErrorMessage());
        return d;
    }
}
