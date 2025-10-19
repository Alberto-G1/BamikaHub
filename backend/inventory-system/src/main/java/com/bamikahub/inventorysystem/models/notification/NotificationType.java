package com.bamikahub.inventorysystem.models.notification;

/**
 * Enumeration of all notification types in the system
 * Categorized by module for better organization
 */
public enum NotificationType {
    
    // ============= USER MANAGEMENT =============
    USER_REGISTERED("New user registered and awaiting approval"),
    USER_APPROVED("Your account has been approved"),
    USER_REJECTED("Your account registration was rejected"),
    USER_DEACTIVATED("Your account has been deactivated"),
    USER_ROLE_CHANGED("Your role has been updated"),
    
    // ============= REQUISITION/FINANCE =============
    REQUISITION_CREATED("New requisition created"),
    REQUISITION_SUBMITTED("Requisition submitted for approval"),
    REQUISITION_APPROVED("Requisition approved"),
    REQUISITION_REJECTED("Requisition rejected"),
    REQUISITION_FULFILLED("Requisition fulfilled"),
    REQUISITION_CANCELLED("Requisition cancelled"),
    REQUISITION_COMMENT_ADDED("New comment on requisition"),
    
    // ============= INVENTORY =============
    ITEM_LOW_STOCK("Item stock level is low"),
    ITEM_OUT_OF_STOCK("Item is out of stock"),
    ITEM_ADDED("New item added to inventory"),
    ITEM_UPDATED("Inventory item updated"),
    ITEM_DELETED("Inventory item removed"),
    STOCK_TRANSACTION("Stock transaction recorded"),
    
    // ============= PROJECTS/OPERATIONS =============
    PROJECT_CREATED("New project created"),
    PROJECT_ASSIGNED("You have been assigned to a project"),
    PROJECT_UPDATED("Project details updated"),
    PROJECT_STATUS_CHANGED("Project status changed"),
    PROJECT_COMPLETED("Project marked as completed"),
    PROJECT_ARCHIVED("Project archived"),
    FIELD_REPORT_SUBMITTED("New field report submitted"),
    FIELD_REPORT_APPROVED("Field report approved"),
    
    // ============= SUPPORT TICKETS =============
    TICKET_CREATED("New support ticket created"),
    TICKET_ASSIGNED("Ticket assigned to you"),
    TICKET_REASSIGNED("Ticket reassigned"),
    TICKET_STATUS_CHANGED("Ticket status updated"),
    TICKET_PRIORITY_CHANGED("Ticket priority changed"),
    TICKET_COMMENT_ADDED("New comment on ticket"),
    TICKET_RESOLVED("Ticket marked as resolved"),
    TICKET_CLOSED("Ticket closed"),
    TICKET_REOPENED("Ticket reopened"),
    TICKET_SLA_WARNING("Ticket approaching SLA deadline"),
    TICKET_SLA_BREACH("Ticket SLA deadline breached"),
    
    // ============= SYSTEM =============
    SYSTEM_MAINTENANCE("System maintenance scheduled"),
    SYSTEM_UPDATE("System updated"),
    SECURITY_ALERT("Security alert"),
    
    // ============= GENERAL =============
    MENTION("You were mentioned"),
    TASK_ASSIGNED("Task assigned to you"),
    TASK_COMPLETED("Task completed"),
    DEADLINE_APPROACHING("Deadline approaching"),
    DEADLINE_PASSED("Deadline passed");
    
    private final String description;
    
    NotificationType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Get user-friendly display name
     */
    public String getDisplayName() {
        String name = name().replace('_', ' ').toLowerCase();
        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = true;
        
        for (char c : name.toCharArray()) {
            if (Character.isWhitespace(c)) {
                capitalizeNext = true;
                result.append(c);
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(c);
            }
        }
        
        return result.toString();
    }
    
    /**
     * Determine if this notification type should trigger email by default
     */
    public boolean isHighPriority() {
        return this == USER_APPROVED ||
               this == REQUISITION_APPROVED ||
               this == REQUISITION_REJECTED ||
               this == PROJECT_ASSIGNED ||
               this == TICKET_ASSIGNED ||
               this == TICKET_SLA_BREACH ||
               this == SECURITY_ALERT ||
               this == DEADLINE_PASSED;
    }
}
