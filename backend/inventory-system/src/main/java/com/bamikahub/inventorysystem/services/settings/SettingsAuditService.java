package com.bamikahub.inventorysystem.services.settings;

import com.bamikahub.inventorysystem.dao.AuditLogRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.settings.SettingsAuditDto;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class SettingsAuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Log a settings change with detailed audit information
     */
    public void logSettingsChange(String settingKey, String settingType, Object oldValue, Object newValue, String changedBy, String changeReason) {
        try {
            User actor = getUserByEmail(changedBy);
            
            Map<String, Object> details = new HashMap<>();
            details.put("settingKey", settingKey);
            details.put("settingType", settingType);
            details.put("oldValue", oldValue != null ? oldValue.toString() : null);
            details.put("newValue", newValue != null ? newValue.toString() : null);
            details.put("changeReason", changeReason);
            details.put("timestamp", LocalDateTime.now());
            
            // Get request details
            HttpServletRequest request = getCurrentHttpRequest();
            if (request != null) {
                details.put("ipAddress", getClientIpAddress(request));
                details.put("userAgent", request.getHeader("User-Agent"));
            }
            
            String detailsJson = objectMapper.writeValueAsString(details);
            
            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .action(settingType.equals("SYSTEM") ? AuditLog.ActionType.SYSTEM_CONFIG_CHANGED : AuditLog.ActionType.USER_UPDATED)
                    .entityType(settingType + "_SETTINGS")
                    .entityName(settingKey)
                    .details(detailsJson)
                    .ipAddress(request != null ? getClientIpAddress(request) : null)
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();
            
            auditLogRepository.save(auditLog);
            
        } catch (JsonProcessingException e) {
            // Log error but don't fail the settings update
            System.err.println("Failed to log settings change: " + e.getMessage());
        }
    }

    /**
     * Get audit history for a specific setting
     */
    public List<SettingsAuditDto> getSettingAuditHistory(String settingKey) {
        List<AuditLog> logs = auditLogRepository.findByEntityTypeContainingAndEntityNameOrderByTimestampDesc("SETTINGS", settingKey);
        
        List<SettingsAuditDto> auditDtos = new ArrayList<>();
        for (AuditLog log : logs) {
            try {
                Map<String, Object> details = objectMapper.readValue(log.getDetails(), Map.class);
                
                SettingsAuditDto dto = new SettingsAuditDto();
                dto.setId(log.getId());
                dto.setSettingKey((String) details.get("settingKey"));
                dto.setSettingType((String) details.get("settingType"));
                dto.setOldValue((String) details.get("oldValue"));
                dto.setNewValue((String) details.get("newValue"));
                dto.setChangedBy(log.getActor().getEmail());
                dto.setChangedAt(log.getTimestamp());
                dto.setIpAddress((String) details.get("ipAddress"));
                dto.setUserAgent((String) details.get("userAgent"));
                dto.setChangeReason((String) details.get("changeReason"));
                
                auditDtos.add(dto);
            } catch (JsonProcessingException e) {
                System.err.println("Failed to parse audit log details: " + e.getMessage());
            }
        }
        
        return auditDtos;
    }

    /**
     * Get all settings audit history (paginated if needed)
     */
    public List<SettingsAuditDto> getAllSettingsAuditHistory(int limit) {
        List<AuditLog> logs = auditLogRepository.findByEntityTypeContainingOrderByTimestampDesc("SETTINGS");
        
        List<SettingsAuditDto> auditDtos = new ArrayList<>();
        int count = 0;
        
        for (AuditLog log : logs) {
            if (count >= limit) break;
            
            try {
                Map<String, Object> details = objectMapper.readValue(log.getDetails(), Map.class);
                
                SettingsAuditDto dto = new SettingsAuditDto();
                dto.setId(log.getId());
                dto.setSettingKey((String) details.get("settingKey"));
                dto.setSettingType((String) details.get("settingType"));
                dto.setOldValue((String) details.get("oldValue"));
                dto.setNewValue((String) details.get("newValue"));
                dto.setChangedBy(log.getActor().getEmail());
                dto.setChangedAt(log.getTimestamp());
                dto.setIpAddress((String) details.get("ipAddress"));
                dto.setUserAgent((String) details.get("userAgent"));
                dto.setChangeReason((String) details.get("changeReason"));
                
                auditDtos.add(dto);
                count++;
            } catch (JsonProcessingException e) {
                System.err.println("Failed to parse audit log details: " + e.getMessage());
            }
        }
        
        return auditDtos;
    }

    /**
     * Helper method to get user by email
     */
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    /**
     * Get current HTTP request from context
     */
    private HttpServletRequest getCurrentHttpRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * Extract client IP address from request (handles proxy headers)
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (ip.contains(",")) {
                    ip = ip.split(",")[0];
                }
                return ip.trim();
            }
        }

        return request.getRemoteAddr();
    }
}
