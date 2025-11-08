package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentStatus;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    // Find assignments by assignee
    List<Assignment> findByAssignee(User assignee);

    // Find assignments by assigner
    List<Assignment> findByAssigner(User assigner);

    // Find assignments by assignee and status
    List<Assignment> findByAssigneeAndStatus(User assignee, AssignmentStatus status);

    // Find assignments by status
    List<Assignment> findByStatus(AssignmentStatus status);

    // Find overdue assignments
    @Query("SELECT a FROM Assignment a WHERE a.dueDate < :now AND a.status NOT IN ('COMPLETED', 'CANCELLED', 'UNDER_REVIEW')")
    List<Assignment> findOverdueAssignments(@Param("now") LocalDateTime now);

    // Find assignments by assignee that are overdue
    @Query("SELECT a FROM Assignment a WHERE a.assignee = :assignee AND a.dueDate < :now AND a.status NOT IN ('COMPLETED', 'CANCELLED', 'UNDER_REVIEW')")
    List<Assignment> findOverdueAssignmentsByAssignee(@Param("assignee") User assignee, @Param("now") LocalDateTime now);

    // Find assignments by assignee ordered by due date
    List<Assignment> findByAssigneeOrderByDueDateAsc(User assignee);

    // Count assignments by assignee and status
    long countByAssigneeAndStatus(User assignee, AssignmentStatus status);

    // Find assignments due within a certain time range
    @Query("SELECT a FROM Assignment a WHERE a.assignee = :assignee AND a.dueDate BETWEEN :start AND :end")
    List<Assignment> findAssignmentsDueInRange(@Param("assignee") User assignee, 
                                                @Param("start") LocalDateTime start, 
                                                @Param("end") LocalDateTime end);
}
