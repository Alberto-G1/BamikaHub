package com.bamikahub.inventorysystem.dao.operations;

import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyFieldReportRepository extends JpaRepository<DailyFieldReport, Long> {
    List<DailyFieldReport> findByProjectId(Long projectId);
    long countBySiteId(Long siteId);
    long countByProjectIdAndSiteIsNull(Long projectId);
    long countBySiteIsNull();
    List<DailyFieldReport> findByProjectIdAndSiteId(Long projectId, Long siteId);
}