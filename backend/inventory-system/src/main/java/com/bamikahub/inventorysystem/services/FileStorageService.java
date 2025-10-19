package com.bamikahub.inventorysystem.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path profilePicLocation;
    private final Path itemImageLocation;
    private final Path supportAttachmentLocation;

    public FileStorageService(@Value("${file.upload-dir.profile-pictures}") String profileUploadDir,
                              @Value("${file.upload-dir.item-images}") String itemUploadDir,
                              @Value("${file.upload-dir.support-attachments}") String supportAttachmentDir) {
        this.profilePicLocation = Paths.get(profileUploadDir).toAbsolutePath().normalize();
        this.itemImageLocation = Paths.get(itemUploadDir).toAbsolutePath().normalize();
        this.supportAttachmentLocation = Paths.get(supportAttachmentDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(profilePicLocation);
            Files.createDirectories(itemImageLocation);
            Files.createDirectories(supportAttachmentLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage locations", e);
        }
    }

    private String store(MultipartFile file, Path location) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file " + originalFilename);
        }
        if (originalFilename.contains("..")) {
            throw new RuntimeException("Cannot store file with relative path outside current directory " + originalFilename);
        }

        String extension = StringUtils.getFilenameExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + "." + extension;

        try {
            Path destinationFile = location.resolve(filename);
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }

    public String storeProfilePicture(MultipartFile file) {
        return store(file, this.profilePicLocation);
    }

    public String storeItemImage(MultipartFile file) {
        return store(file, this.itemImageLocation);
    }

    public String storeSupportAttachment(MultipartFile file) {
        return store(file, this.supportAttachmentLocation);
    }
}