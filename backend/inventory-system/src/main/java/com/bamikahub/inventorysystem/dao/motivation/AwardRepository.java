package com.bamikahub.inventorysystem.dao.motivation;

import com.bamikahub.inventorysystem.models.motivation.Award;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AwardRepository extends JpaRepository<Award, Long> {

    @Query("select a from Award a where a.active = true and (a.expiresAt is null or a.expiresAt > :now) order by a.priority asc, a.awardDate desc")
    List<Award> findActiveAwards(LocalDateTime now);
}
