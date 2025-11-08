package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentCommentRepository extends JpaRepository<AssignmentComment, Long> {
    List<AssignmentComment> findByAssignmentOrderByCreatedAtDesc(Assignment assignment);
}
