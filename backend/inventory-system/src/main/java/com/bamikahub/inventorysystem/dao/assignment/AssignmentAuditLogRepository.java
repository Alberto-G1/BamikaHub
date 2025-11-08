package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentAuditLogRepository extends JpaRepository<AssignmentAuditLog, Long> {
    List<AssignmentAuditLog> findByAssignmentOrderByCreatedAtDesc(Assignment assignment);
}
