package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentActivityRepository extends JpaRepository<AssignmentActivity, Long> {
    List<AssignmentActivity> findByAssignmentOrderByOrderIndexAscIdAsc(Assignment assignment);
}
