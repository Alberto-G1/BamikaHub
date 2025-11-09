package com.bamikahub.inventorysystem.services.chat;

import com.bamikahub.inventorysystem.dao.chat.ChatAuditLogRepository;
import com.bamikahub.inventorysystem.models.chat.ChatAuditLog;
import com.bamikahub.inventorysystem.models.chat.ChatMessage;
import com.bamikahub.inventorysystem.models.chat.ChatThread;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatAuditService {

    private final ChatAuditLogRepository auditLogRepository;

    public void logMessageSent(ChatThread thread, ChatMessage message) {
        Map<String, Object> meta = baseMeta();
        meta.put("messageType", message.getMessageType().name());
        meta.put("contentLength", message.getContent() != null ? message.getContent().length() : 0);
        persist(ChatAuditLog.AuditAction.MESSAGE_SENT, message.getSender(), thread, message, meta);
    }

    public void logMessageDeleted(User actor, ChatThread thread, ChatMessage message) {
        Map<String, Object> meta = baseMeta();
        meta.put("deletedBy", actor != null ? actor.getId() : null);
        persist(ChatAuditLog.AuditAction.MESSAGE_DELETED, actor, thread, message, meta);
    }

    public void logAttachmentUploaded(ChatMessage message) {
        Map<String, Object> meta = baseMeta();
        if (message.getAttachment() != null) {
            meta.put("fileName", message.getAttachment().getFileName());
            meta.put("fileSize", message.getAttachment().getFileSize());
        }
        persist(ChatAuditLog.AuditAction.ATTACHMENT_UPLOADED, message.getSender(), message.getThread(), message, meta);
    }

    public void logMessageDelivered(ChatMessage message, User recipient) {
        Map<String, Object> meta = baseMeta();
        meta.put("recipientId", recipient.getId());
        persist(ChatAuditLog.AuditAction.MESSAGE_DELIVERED, recipient, message.getThread(), message, meta);
    }

    public void logMessageRead(ChatMessage message, User recipient) {
        Map<String, Object> meta = baseMeta();
        meta.put("recipientId", recipient.getId());
        persist(ChatAuditLog.AuditAction.MESSAGE_READ, recipient, message.getThread(), message, meta);
    }

    public void logPresenceJoined(User user, String channel) {
        persist(ChatAuditLog.AuditAction.PRESENCE_JOINED, user, channel, null, null, baseMeta());
    }

    public void logPresenceLeft(User user, String channel) {
        persist(ChatAuditLog.AuditAction.PRESENCE_LEFT, user, channel, null, null, baseMeta());
    }

    private Map<String, Object> baseMeta() {
        return new HashMap<>();
    }

    private void persist(ChatAuditLog.AuditAction action,
                         User actor,
                         ChatThread thread,
                         ChatMessage message,
                         Map<String, Object> metadata) {
        persist(action, actor, thread != null ? thread.getType().name() : null,
                thread != null ? thread.getId() : null,
                message != null ? message.getId() : null,
                metadata);
    }

    private void persist(ChatAuditLog.AuditAction action,
                         User actor,
                         String channel,
                         Long threadId,
                         Long messageId,
                         Map<String, Object> metadata) {
        try {
            ChatAuditLog auditLog = new ChatAuditLog();
            auditLog.setAction(action);
            auditLog.setActor(actor);
            auditLog.setChannel(channel);
            auditLog.setThreadId(threadId);
            auditLog.setMessageId(messageId);
            auditLog.setTargetUserId(null);
            auditLog.setMetadataJson(toJson(metadata));
            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to persist chat audit event action={} threadId={} messageId={} error={}",
                    action, threadId, messageId, ex.getMessage(), ex);
        }
    }

    private String toJson(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : metadata.entrySet()) {
            if (!first) {
                sb.append(',');
            }
            sb.append('"').append(escape(entry.getKey())).append('"').append(':');
            Object value = entry.getValue();
            if (value == null) {
                sb.append("null");
            } else if (value instanceof Number || value instanceof Boolean) {
                sb.append(value);
            } else {
                sb.append('"').append(escape(String.valueOf(value))).append('"');
            }
            first = false;
        }
        sb.append('}');
        return sb.toString();
    }

    private String escape(String input) {
        return input == null ? "" : input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
