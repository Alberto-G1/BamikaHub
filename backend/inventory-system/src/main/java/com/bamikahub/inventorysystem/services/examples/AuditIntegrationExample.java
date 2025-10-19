package com.bamikahub.inventorysystem.services.examples;

import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * EXAMPLE: How to integrate AuditService into existing services
 * 
 * This is a reference implementation showing best practices for adding
 * audit logging to your service methods.
 */
@Service
@RequiredArgsConstructor
public class AuditIntegrationExample {

    private final AuditService auditService;
    // Your existing repositories/services here

    /**
     * EXAMPLE 1: Simple Create Operation
     * 
     * Pattern: Log after successful creation
     */
    @Transactional
    public User createUser(CreateUserDto dto, User currentUser) {
        // 1. Perform the business operation
        User newUser = new User();
        newUser.setFirstName(dto.getFirstName());
        newUser.setLastName(dto.getLastName());
        newUser.setEmail(dto.getEmail());
        // ... set other fields
        // newUser = userRepository.save(newUser);
        
        // 2. Log the action (asynchronous, won't block)
        auditService.logAction(
            currentUser,                          // Who performed the action
            AuditLog.ActionType.USER_CREATED,    // What action was performed
            "User",                               // Entity type
            newUser.getId(),                      // Entity ID
            newUser.getFirstName() + " " + newUser.getLastName(),  // Human-readable entity name
            "New user account created"            // Simple description
        );
        
        return newUser;
    }

    /**
     * EXAMPLE 2: Update Operation with Change Tracking
     * 
     * Pattern: Capture old values, perform update, log changes
     */
    @Transactional
    public User updateUser(Long userId, UpdateUserDto dto, User currentUser) {
        // 1. Fetch existing entity
        // User user = userRepository.findById(userId).orElseThrow();
        User user = new User(); // Mock for example
        
        // 2. Capture old values (optional but recommended)
        String oldEmail = user.getEmail();
        String oldRole = user.getRole() != null ? user.getRole().getName() : null;
        
        // 3. Perform the update
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        // ... update other fields
        // user = userRepository.save(user);
        
        // 4. Build detailed change log (for important updates)
        Map<String, Object> changes = new HashMap<>();
        if (!oldEmail.equals(user.getEmail())) {
            changes.put("email", Map.of(
                "old", oldEmail,
                "new", user.getEmail()
            ));
        }
        changes.put("updatedBy", currentUser.getEmail());
        changes.put("timestamp", System.currentTimeMillis());
        
        // 5. Log with detailed changes
        auditService.logAction(
            currentUser,
            AuditLog.ActionType.USER_UPDATED,
            "User",
            user.getId(),
            user.getFirstName() + " " + user.getLastName(),
            changes  // Will be serialized to JSON automatically
        );
        
        return user;
    }

    /**
     * EXAMPLE 3: Delete Operation (Critical Action)
     * 
     * Pattern: Capture entity details before deletion, log as CRITICAL
     */
    @Transactional
    public void deleteUser(Long userId, User adminUser) {
        // 1. Fetch entity before deletion
        // User user = userRepository.findById(userId).orElseThrow();
        User user = new User(); // Mock for example
        String userName = user.getFirstName() + " " + user.getLastName();
        String userEmail = user.getEmail();
        
        // 2. Perform deletion
        // userRepository.delete(user);
        
        // 3. Log as CRITICAL with override (deletions are always critical)
        auditService.logActionWithSeverity(
            adminUser,
            AuditLog.ActionType.USER_DELETED,
            "User",
            userId,
            userName,
            String.format("User account deleted: %s (%s)", userName, userEmail),
            AuditLog.Severity.CRITICAL  // Explicitly mark as critical
        );
    }

    /**
     * EXAMPLE 4: Status Change Operation
     * 
     * Pattern: Log status transitions
     */
    @Transactional
    public void changeProjectStatus(Long projectId, String newStatus, User currentUser) {
        // Project project = projectRepository.findById(projectId).orElseThrow();
        // String oldStatus = project.getStatus().name();
        String oldStatus = "IN_PROGRESS"; // Mock
        
        // project.setStatus(Project.ProjectStatus.valueOf(newStatus));
        // project = projectRepository.save(project);
        
        Map<String, Object> details = new HashMap<>();
        details.put("oldStatus", oldStatus);
        details.put("newStatus", newStatus);
        details.put("reason", "Status updated by user");
        
        auditService.logAction(
            currentUser,
            AuditLog.ActionType.PROJECT_STATUS_CHANGED,
            "Project",
            projectId,
            "Project Name", // project.getName()
            details
        );
    }

    /**
     * EXAMPLE 5: Approval Operation
     * 
     * Pattern: Log approval/rejection with notes
     */
    @Transactional
    public void approveRequisition(Long requisitionId, String notes, User approver) {
        // Requisition req = requisitionRepository.findById(requisitionId).orElseThrow();
        // req.setStatus(Requisition.RequisitionStatus.APPROVED_BY_FINANCE);
        // req.setApprovedBy(approver);
        // req.setApprovalNotes(notes);
        // req = requisitionRepository.save(req);
        
        Map<String, Object> details = new HashMap<>();
        details.put("approvalNotes", notes);
        details.put("approvalLevel", "FINANCE");
        // details.put("totalAmount", req.getTotalEstimatedCost());
        
        auditService.logAction(
            approver,
            AuditLog.ActionType.REQUISITION_APPROVED_FINANCE,
            "Requisition",
            requisitionId,
            "REQ-" + requisitionId, // req.getId()
            details
        );
    }

    /**
     * EXAMPLE 6: Bulk Operation
     * 
     * Pattern: Log summary for bulk operations
     */
    @Transactional
    public void bulkUpdateItems(List<Long> itemIds, UpdateItemDto dto, User currentUser) {
        // List<Item> items = itemRepository.findAllById(itemIds);
        
        // for (Item item : items) {
        //     item.setReorderThreshold(dto.getReorderThreshold());
        //     itemRepository.save(item);
        // }
        
        // Log a single summary entry for bulk operation
        Map<String, Object> details = new HashMap<>();
        details.put("itemCount", itemIds.size());
        details.put("itemIds", itemIds);
        details.put("updateType", "REORDER_THRESHOLD_CHANGE");
        details.put("newThreshold", dto.getReorderThreshold());
        
        auditService.logAction(
            currentUser,
            AuditLog.ActionType.ITEM_REORDER_THRESHOLD_CHANGED,
            "Item",
            null,  // No single entity ID for bulk
            "Bulk Update",
            details
        );
    }

    /**
     * EXAMPLE 7: Simple Action Without Entity
     * 
     * Pattern: For system-level actions
     */
    public void performBackup(User adminUser) {
        // ... backup logic
        
        auditService.logAction(
            adminUser,
            AuditLog.ActionType.BACKUP_CREATED,
            "System backup initiated"
        );
    }

    /**
     * EXAMPLE 8: Login/Authentication
     * 
     * Pattern: Log authentication events
     */
    public void recordLogin(User user, boolean success, String ipAddress) {
        if (success) {
            Map<String, Object> details = new HashMap<>();
            details.put("loginMethod", "PASSWORD");
            details.put("ipAddress", ipAddress);
            details.put("timestamp", System.currentTimeMillis());
            
            auditService.logAction(
                user,
                AuditLog.ActionType.USER_LOGIN,
                "User",
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                details
            );
        } else {
            // Failed login attempts should also be logged
            // but handled differently (security monitoring)
        }
    }

    /**
     * EXAMPLE 9: Using Helper Methods
     * 
     * Pattern: Build change details with helper
     */
    public void updateItemPrice(Long itemId, double newPrice, User currentUser) {
        // Item item = itemRepository.findById(itemId).orElseThrow();
        // double oldPrice = item.getUnitCost().doubleValue();
        double oldPrice = 1000.0; // Mock
        
        // item.setUnitCost(BigDecimal.valueOf(newPrice));
        // item = itemRepository.save(item);
        
        // Use helper method for simple field changes
        String changeDetails = auditService.buildChangeDetails(
            "unitCost",
            oldPrice,
            newPrice
        );
        
        auditService.logAction(
            currentUser,
            AuditLog.ActionType.ITEM_UPDATED,
            "Item",
            itemId,
            "Item Name", // item.getName()
            changeDetails
        );
    }

    /**
     * EXAMPLE 10: Role/Permission Changes
     * 
     * Pattern: Log security-sensitive operations
     */
    @Transactional
    public void changeUserRole(Long userId, Long newRoleId, User adminUser) {
        // User user = userRepository.findById(userId).orElseThrow();
        // Role oldRole = user.getRole();
        // Role newRole = roleRepository.findById(newRoleId).orElseThrow();
        
        // user.setRole(newRole);
        // user = userRepository.save(user);
        
        Map<String, Object> details = new HashMap<>();
        details.put("userId", userId);
        details.put("oldRole", "USER"); // oldRole.getName()
        details.put("newRole", "ADMIN"); // newRole.getName()
        details.put("changedBy", adminUser.getEmail());
        
        auditService.logActionWithSeverity(
            adminUser,
            AuditLog.ActionType.USER_ROLE_CHANGED,
            "User",
            userId,
            "User Name", // user.getFullName()
            details,
            AuditLog.Severity.WARNING  // Role changes are at least WARNING
        );
    }

    // ==================== MOCK CLASSES FOR EXAMPLE ====================
    
    static class CreateUserDto {
        String firstName;
        String lastName;
        String email;
        
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getEmail() { return email; }
    }
    
    static class UpdateUserDto {
        String email;
        String firstName;
        String lastName;
        
        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
    }
    
    static class UpdateItemDto {
        Integer reorderThreshold;
        
        public Integer getReorderThreshold() { return reorderThreshold; }
    }
}
