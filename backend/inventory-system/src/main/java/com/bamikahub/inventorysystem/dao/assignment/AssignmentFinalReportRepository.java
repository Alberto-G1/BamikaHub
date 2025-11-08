package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.AssignmentFinalReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentFinalReportRepository extends JpaRepository<AssignmentFinalReport, Long> {
    AssignmentFinalReport findByAssignmentId(Long assignmentId);
}
