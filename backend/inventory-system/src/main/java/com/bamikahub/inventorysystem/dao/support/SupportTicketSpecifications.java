package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.dto.support.TicketFilterCriteria;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

public final class SupportTicketSpecifications {

    private SupportTicketSpecifications() {
    }

    public static Specification<SupportTicket> byFilter(TicketFilterCriteria criteria) {
        return Specification.where(statusEquals(criteria.getStatus()))
                .and(priorityEquals(criteria.getPriority()))
                .and(categoryEquals(criteria.getCategoryId()))
                .and(assignedToEquals(criteria.getAssignedToId()))
                .and(submittedByEquals(criteria.getSubmittedById()))
                .and(createdAfter(criteria.getStartDate()))
                .and(createdBefore(criteria.getEndDate()))
                .and(inventoryEquals(criteria.getInventoryItemId()))
                .and(projectEquals(criteria.getProjectId()))
                .and(departmentEquals(criteria.getDepartment()))
                .and(searchTerm(criteria.getSearch()))
                .and(archived(criteria.isIncludeArchived()));
    }

    private static Specification<SupportTicket> statusEquals(SupportTicket.TicketStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private static Specification<SupportTicket> priorityEquals(SupportTicket.TicketPriority priority) {
        if (priority == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("priority"), priority);
    }

    private static Specification<SupportTicket> categoryEquals(Integer categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.join("category", JoinType.LEFT).get("id"), categoryId);
    }

    private static Specification<SupportTicket> assignedToEquals(Long userId) {
        if (userId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.join("assignedTo", JoinType.LEFT).get("id"), userId);
    }

    private static Specification<SupportTicket> submittedByEquals(Long userId) {
        if (userId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.join("submittedBy", JoinType.LEFT).get("id"), userId);
    }

    private static Specification<SupportTicket> createdAfter(java.time.LocalDate startDate) {
        if (startDate == null) {
            return null;
        }
        LocalDateTime startOfDay = startDate.atStartOfDay();
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), startOfDay);
    }

    private static Specification<SupportTicket> createdBefore(java.time.LocalDate endDate) {
        if (endDate == null) {
            return null;
        }
        LocalDateTime endOfDay = endDate.atTime(23, 59, 59);
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endOfDay);
    }

    private static Specification<SupportTicket> inventoryEquals(Long inventoryItemId) {
        if (inventoryItemId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.join("relatedInventoryItem", JoinType.LEFT).get("id"), inventoryItemId);
    }

    private static Specification<SupportTicket> projectEquals(Long projectId) {
        if (projectId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.join("relatedProject", JoinType.LEFT).get("id"), projectId);
    }

    private static Specification<SupportTicket> departmentEquals(String department) {
        if (!StringUtils.hasText(department)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("submitterDepartment")), department.toLowerCase());
    }

    private static Specification<SupportTicket> searchTerm(String search) {
        if (!StringUtils.hasText(search)) {
            return null;
        }
        String likeValue = "%" + search.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("subject")), likeValue),
                cb.like(cb.lower(root.get("description")), likeValue),
                cb.like(cb.lower(root.get("otherCategory")), likeValue)
        );
    }

    private static Specification<SupportTicket> archived(boolean includeArchived) {
        if (includeArchived) {
            return null;
        }
        return (root, query, cb) -> cb.isFalse(root.get("archived"));
    }
}
