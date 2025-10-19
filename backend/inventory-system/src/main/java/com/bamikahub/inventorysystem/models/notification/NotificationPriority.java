package com.bamikahub.inventorysystem.models.notification;

/**
 * Priority levels for notifications
 * Determines visual styling and ordering in notification center
 */
public enum NotificationPriority {
    LOW("Low priority"),
    NORMAL("Normal priority"),
    HIGH("High priority"),
    URGENT("Urgent - requires immediate attention");
    
    private final String description;
    
    NotificationPriority(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Get CSS class for styling
     */
    public String getCssClass() {
        switch (this) {
            case LOW: return "text-secondary";
            case NORMAL: return "text-primary";
            case HIGH: return "text-warning";
            case URGENT: return "text-danger";
            default: return "text-primary";
        }
    }
    
    /**
     * Get icon for notification
     */
    public String getIcon() {
        switch (this) {
            case LOW: return "info-circle";
            case NORMAL: return "bell";
            case HIGH: return "exclamation-triangle";
            case URGENT: return "exclamation-circle";
            default: return "bell";
        }
    }
}
