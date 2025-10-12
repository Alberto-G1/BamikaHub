package com.bamikahub.inventorysystem.dao.operations;

import com.bamikahub.inventorysystem.models.operations.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {}