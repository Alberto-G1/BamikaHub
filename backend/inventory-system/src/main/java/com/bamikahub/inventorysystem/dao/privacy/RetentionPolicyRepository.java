package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.RetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetentionPolicyRepository extends JpaRepository<RetentionPolicy, Long> {

    Optional<RetentionPolicy> findByDataType(String dataType);

    List<RetentionPolicy> findByIsActiveTrue();

    @Query("SELECT r FROM RetentionPolicy r WHERE r.isActive = true AND r.autoDelete = true")
    List<RetentionPolicy> findActivePoliciesWithAutoDelete();

    long countByIsActiveTrue();
}
