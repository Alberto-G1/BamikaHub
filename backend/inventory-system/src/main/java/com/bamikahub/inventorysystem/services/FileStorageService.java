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

    private final Path rootLocation;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize(); // <-- MAKE ABSOLUTE AND NORMALIZE
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    public String store(MultipartFile file) {
        // Sanitize filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file " + originalFilename);
        }
        if (originalFilename.contains("..")) {
            // This is a security check for path traversal
            throw new RuntimeException("Cannot store file with relative path outside current directory " + originalFilename);
        }

        // Create a unique filename
        String extension = StringUtils.getFilenameExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + "." + extension;

        try {
            Path destinationFile = this.rootLocation.resolve(filename);

            // This is a simpler and more robust way to copy
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }
}