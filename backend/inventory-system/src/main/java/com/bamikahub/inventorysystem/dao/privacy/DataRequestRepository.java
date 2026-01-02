package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.models.privacy.DataRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DataRequestRepository extends JpaRepository<DataRequest, Long> {

    List<DataRequest> findByUserOrderByRequestDateDesc(User user);

    List<DataRequest> findByStatusOrderByRequestDateAsc(String status);

    List<DataRequest> findByRequestTypeAndStatus(String requestType, String status);

    Optional<DataRequest> findByIdAndUser(Long id, User user);

    Optional<DataRequest> findByVerificationCode(String verificationCode);

    @Query("SELECT d FROM DataRequest d WHERE d.status = 'PENDING' AND d.requestDate < :overdueDate")
    List<DataRequest> findOverdueRequests(@Param("overdueDate") LocalDateTime overdueDate);

    @Query("SELECT COUNT(d) FROM DataRequest d WHERE d.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(d) FROM DataRequest d WHERE d.requestType = :type AND d.completedDate >= :startDate")
    long countCompletedRequestsByTypeAfter(@Param("type") String type, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT d FROM DataRequest d WHERE d.user = :user AND d.requestType = :type AND d.status IN ('PENDING', 'IN_PROGRESS')")
    Optional<DataRequest> findActiveRequestByUserAndType(@Param("user") User user, @Param("type") String type);
}
