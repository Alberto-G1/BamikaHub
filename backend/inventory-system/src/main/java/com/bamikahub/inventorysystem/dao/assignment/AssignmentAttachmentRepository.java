package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentAttachmentRepository extends JpaRepository<AssignmentAttachment, Long> {
    List<AssignmentAttachment> findByAssignmentOrderByUploadedAtDesc(Assignment assignment);
}
