package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.DataExportRequest;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataExportRequestRepository extends JpaRepository<DataExportRequest, Long> {
    Page<DataExportRequest> findByUser(User user, Pageable pageable);
    List<DataExportRequest> findByUserAndStatus(User user, String status);

    @Query("SELECT der FROM DataExportRequest der WHERE der.status IN :statuses ORDER BY der.requestedAt DESC")
    Page<DataExportRequest> findPendingRequests(@Param("statuses") List<String> statuses, Pageable pageable);

    long countByUserAndStatus(User user, String status);
}