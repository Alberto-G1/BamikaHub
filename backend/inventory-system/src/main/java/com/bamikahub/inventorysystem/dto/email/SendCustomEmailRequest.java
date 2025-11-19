package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SendCustomEmailRequest {
    private String subject;
    private String body; // HTML body
    private List<Long> userIds; // optional
    private List<String> emails; // optional free-form emails
    private List<String> roles; // optional role-based groups
    private List<String> departments; // optional
    private boolean sendInAppNotification = true;
    private List<String> attachmentPaths; // optional uploaded attachment paths
    private Long templateId; // optional template to use
    private Map<String, Object> templateVars; // template variables
    // If true, backend will render and return the HTML preview without actually sending
    private boolean preview = false;
}
