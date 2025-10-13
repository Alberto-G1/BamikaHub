package com.bamikahub.inventorysystem.dao.operations;

import com.bamikahub.inventorysystem.models.operations.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Override
    @Query("select p from Project p where p.isArchived = false")
    List<Project> findAll();

    // New method to find only archived projects
    List<Project> findByIsArchived(boolean isArchived);
}