package com.bamikahub.inventorysystem.dao.operations;

import com.bamikahub.inventorysystem.models.operations.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    List<Site> findByProjectId(Long projectId);
    long countByProjectId(Long projectId);
}
