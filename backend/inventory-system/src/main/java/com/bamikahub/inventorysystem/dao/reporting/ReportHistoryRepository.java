package com.bamikahub.inventorysystem.dao.reporting;

import com.bamikahub.inventorysystem.models.reporting.ReportHistory;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReportHistoryRepository extends JpaRepository<ReportHistory, Long> {
    List<ReportHistory> findByGeneratedByOrderByGeneratedAtDesc(User user);
    List<ReportHistory> findByReportTypeOrderByGeneratedAtDesc(String reportType);
    List<ReportHistory> findByGeneratedAtBetweenOrderByGeneratedAtDesc(LocalDateTime start, LocalDateTime end);
}
