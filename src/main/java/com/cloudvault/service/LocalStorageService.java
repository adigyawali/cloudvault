package com.cloudvault.service;

import com.cloudvault.config.StorageConfig;
import com.cloudvault.dto.FileResponse;
import com.cloudvault.exception.FileNotFoundException;
import com.cloudvault.exception.StorageException;
import com.cloudvault.model.FileMetadata;
import com.cloudvault.model.Folder;
import com.cloudvault.model.User;
import com.cloudvault.repository.FileRepository;
import com.cloudvault.repository.FolderRepository;
import com.cloudvault.repository.UserRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Local-disk {@link StorageService}. Marked {@link Primary} so a future
 * S3 implementation can be added without an ambiguous-bean conflict.
 */
@Service
@Primary
public class LocalStorageService implements StorageService {

    private final Path rootLocation;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final FileMapper fileMapper;

    public LocalStorageService(StorageConfig properties, FileRepository fileRepository, FolderRepository folderRepository, UserRepository userRepository, FileMapper fileMapper) {
        this.rootLocation = Paths.get(properties.getLocation());
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
        this.fileMapper = fileMapper;
        init();
    }

    private void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage", e);
        }
    }

    @Override
    public FileResponse store(MultipartFile file, Long folderId) {
        User user = getCurrentUser();

        String filename = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                throw new StorageException("Cannot store file with relative path outside current directory " + filename);
            }

            // Unique filename to prevent overwrite on disk
            String diskFilename = System.currentTimeMillis() + "_" + filename;
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, this.rootLocation.resolve(diskFilename),
                        StandardCopyOption.REPLACE_EXISTING);
            }

            FileMetadata metadata = FileMetadata.builder()
                    .name(filename)
                    .type(file.getContentType())
                    .size(file.getSize())
                    .path(diskFilename)
                    .owner(user)
                    .build();

            if (folderId != null) {
                Folder folder = folderRepository.findByIdAndOwnerId(folderId, user.getId())
                        .orElseThrow(() -> new FileNotFoundException("Folder not found"));
                metadata.setFolder(folder);
            }

            fileRepository.save(metadata);

            return fileMapper.toResponse(metadata);

        } catch (IOException e) {
            throw new StorageException("Failed to store file " + filename, e);
        }
    }

    @Override
    public List<FileResponse> loadAll(Long folderId) {
        User user = getCurrentUser();

        List<FileMetadata> files;
        if (folderId != null) {
             files = fileRepository.findByOwnerIdAndFolderId(user.getId(), folderId);
        } else {
             files = fileRepository.findByOwnerIdAndFolderIsNull(user.getId());
        }

        return files.stream().map(fileMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public Resource loadAsResource(Long fileId) {
        try {
            User user = getCurrentUser();
            FileMetadata metadata = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                    .orElseThrow(() -> new FileNotFoundException("File not found id: " + fileId));

            Path file = rootLocation.resolve(metadata.getPath());
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("Could not read file: " + metadata.getName());
            }
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("Could not read file", e);
        }
    }

    @Override
    public String getContentType(Long fileId) {
        User user = getCurrentUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                .orElseThrow(() -> new FileNotFoundException("File not found id: " + fileId));
        return metadata.getType();
    }

    @Override
    public void delete(Long fileId) {
         User user = getCurrentUser();
         FileMetadata metadata = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                 .orElseThrow(() -> new FileNotFoundException("File not found id: " + fileId));

         try {
             Files.deleteIfExists(rootLocation.resolve(metadata.getPath()));
             fileRepository.delete(metadata);
         } catch (IOException e) {
             throw new StorageException("Could not delete file", e);
         }
    }

    // Removes the on-disk bytes for every file in a folder subtree. The DB rows
    // are removed by JPA cascade when FolderService deletes the folder, so this
    // only cleans storage. Kept in the storage layer so an S3 implementation can
    // override deletion semantics.
    @Override
    public void deleteFilesUnderFolderTree(Long folderId) {
        deleteTreeBytes(folderId, getCurrentUser().getId());
    }

    private void deleteTreeBytes(Long folderId, Long ownerId) {
        for (Folder sub : folderRepository.findByOwnerIdAndParentId(ownerId, folderId)) {
            deleteTreeBytes(sub.getId(), ownerId);
        }
        for (FileMetadata file : fileRepository.findByOwnerIdAndFolderId(ownerId, folderId)) {
            try {
                Files.deleteIfExists(rootLocation.resolve(file.getPath()));
            } catch (IOException e) {
                throw new StorageException("Could not delete file " + file.getName(), e);
            }
        }
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(username).orElseThrow();
    }
}
