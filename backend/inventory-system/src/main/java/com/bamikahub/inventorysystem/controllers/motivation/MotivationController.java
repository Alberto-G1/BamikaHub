package com.bamikahub.inventorysystem.controllers.motivation;

import com.bamikahub.inventorysystem.dto.motivation.AwardDTO;
import com.bamikahub.inventorysystem.services.motivation.AwardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/motivation")
@RequiredArgsConstructor
public class MotivationController {

    private final AwardService awardService;

    @GetMapping("/wall-of-fame")
    // Public endpoint - no authentication required for login/register page display
    public ResponseEntity<List<AwardDTO>> getWallOfFame() {
        List<AwardDTO> awards = awardService.getActiveAwards();
        return ResponseEntity.ok(awards);
    }

    @GetMapping("/awards")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')") // Admin access to view all awards
    public ResponseEntity<List<AwardDTO>> getAllAwards() {
        List<AwardDTO> awards = awardService.getAllAwards();
        return ResponseEntity.ok(awards);
    }

    @GetMapping("/awards/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AwardDTO> getAwardById(@PathVariable Long id) {
        AwardDTO award = awardService.getAwardById(id);
        return ResponseEntity.ok(award);
    }

    @PostMapping("/awards")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')") // Admin can create awards
    public ResponseEntity<?> createAward(
            @RequestPart("award") AwardDTO awardDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            AwardDTO created = awardService.createAward(awardDTO, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create award: " + e.getMessage());
        }
    }

    @PutMapping("/awards/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')") // Admin can update awards
    public ResponseEntity<?> updateAward(
            @PathVariable Long id,
            @RequestPart("award") AwardDTO awardDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            AwardDTO updated = awardService.updateAward(id, awardDTO, image);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update award: " + e.getMessage());
        }
    }

    @DeleteMapping("/awards/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')") // Admin can delete awards
    public ResponseEntity<Void> deleteAward(@PathVariable Long id) {
        awardService.deleteAward(id);
        return ResponseEntity.noContent().build();
    }
}
