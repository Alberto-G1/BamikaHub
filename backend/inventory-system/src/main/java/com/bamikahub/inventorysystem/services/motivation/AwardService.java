package com.bamikahub.inventorysystem.services.motivation;

import com.bamikahub.inventorysystem.dao.motivation.AwardRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.motivation.AwardDTO;
import com.bamikahub.inventorysystem.models.motivation.Award;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AwardService {

    private final AwardRepository awardRepository;
    private final UserRepository userRepository;
    private static final String UPLOAD_DIR = "uploads/wall-of-fame-images/";

    public List<AwardDTO> getActiveAwards() {
        List<Award> awards = awardRepository.findActiveAwards(LocalDateTime.now());
        return awards.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AwardDTO> getAllAwards() {
        List<Award> awards = awardRepository.findAll();
        return awards.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public AwardDTO getAwardById(Long id) {
        Award award = awardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Award not found with id: " + id));
        return toDTO(award);
    }

    @Transactional
    public AwardDTO createAward(AwardDTO awardDTO, MultipartFile image) {
        User user = userRepository.findById(awardDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + awardDTO.getUserId()));

        Award award = new Award();
        award.setUser(user);
        award.setAchievementTitle(awardDTO.getAchievementTitle());
        award.setAchievementDescription(awardDTO.getAchievementDescription() != null && !awardDTO.getAchievementDescription().isEmpty() 
                ? awardDTO.getAchievementDescription() 
                : "Outstanding achievement");
        award.setBadges(awardDTO.getBadges());
        award.setPriority(awardDTO.getPriority() != null ? awardDTO.getPriority() : 0);
        award.setAwardDate(awardDTO.getAwardDate() != null ? awardDTO.getAwardDate() : LocalDateTime.now());
        award.setExpiresAt(awardDTO.getExpiresAt());
        award.setActive(true);

        // Handle image upload
        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            award.setDisplayImageUrl(imageUrl);
        }

        Award saved = awardRepository.save(award);
        return toDTO(saved);
    }

    @Transactional
    public AwardDTO updateAward(Long id, AwardDTO awardDTO, MultipartFile image) {
        Award award = awardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Award not found with id: " + id));

        if (awardDTO.getUserId() != null) {
            User user = userRepository.findById(awardDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + awardDTO.getUserId()));
            award.setUser(user);
        }

        if (awardDTO.getAchievementTitle() != null) {
            award.setAchievementTitle(awardDTO.getAchievementTitle());
        }
        if (awardDTO.getAchievementDescription() != null) {
            award.setAchievementDescription(awardDTO.getAchievementDescription());
        }
        if (awardDTO.getBadges() != null) {
            award.setBadges(awardDTO.getBadges());
        }
        if (awardDTO.getPriority() != null) {
            award.setPriority(awardDTO.getPriority());
        }
        if (awardDTO.getAwardDate() != null) {
            award.setAwardDate(awardDTO.getAwardDate());
        }
        if (awardDTO.getExpiresAt() != null) {
            award.setExpiresAt(awardDTO.getExpiresAt());
        }

        // Handle image upload
        if (image != null && !image.isEmpty()) {
            // Delete old image if exists
            if (award.getDisplayImageUrl() != null) {
                deleteImage(award.getDisplayImageUrl());
            }
            String imageUrl = saveImage(image);
            award.setDisplayImageUrl(imageUrl);
        }

        Award updated = awardRepository.save(award);
        return toDTO(updated);
    }

    @Transactional
    public void deleteAward(Long id) {
        Award award = awardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Award not found with id: " + id));
        
        // Delete associated image
        if (award.getDisplayImageUrl() != null) {
            deleteImage(award.getDisplayImageUrl());
        }
        
        awardRepository.delete(award);
    }

    private String saveImage(MultipartFile file) {
        try {
            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/wall-of-fame-images/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
    }

    private void deleteImage(String imageUrl) {
        try {
            if (imageUrl != null && imageUrl.startsWith("/uploads/")) {
                Path filePath = Paths.get(imageUrl.substring(1)); // Remove leading slash
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            // Log error but don't throw - deletion failure shouldn't block award deletion
            System.err.println("Failed to delete image: " + e.getMessage());
        }
    }

    private AwardDTO toDTO(Award award) {
        AwardDTO dto = new AwardDTO();
        dto.setId(award.getId());
        dto.setUserId(award.getUser().getId());
        dto.setUserName(award.getUser().getFirstName() + " " + award.getUser().getLastName());
        dto.setAchievementTitle(award.getAchievementTitle());
        dto.setAchievementDescription(award.getAchievementDescription());
        dto.setDisplayImageUrl(award.getDisplayImageUrl());
        dto.setProfilePictureUrl(award.getUser().getProfilePictureUrl());
        dto.setBadges(award.getBadges());
        dto.setPriority(award.getPriority());
        dto.setAwardDate(award.getAwardDate());
        dto.setExpiresAt(award.getExpiresAt());
        return dto;
    }
}
