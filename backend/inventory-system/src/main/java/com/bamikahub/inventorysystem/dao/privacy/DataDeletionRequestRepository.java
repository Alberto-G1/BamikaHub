package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.DataDeletionRequest;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataDeletionRequestRepository extends JpaRepository<DataDeletionRequest, Long> {
    Page<DataDeletionRequest> findByUser(User user, Pageable pageable);
    List<DataDeletionRequest> findByUserAndStatus(User user, String status);

    @Query("SELECT ddr FROM DataDeletionRequest ddr WHERE ddr.status IN :statuses ORDER BY ddr.requestedAt DESC")
    Page<DataDeletionRequest> findPendingRequests(@Param("statuses") List<String> statuses, Pageable pageable);

    long countByUserAndStatus(User user, String status);
}