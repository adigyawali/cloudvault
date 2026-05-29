package com.cloudvault.service;

import com.cloudvault.dto.FileResponse;
import com.cloudvault.exception.FileNotFoundException;
import com.cloudvault.exception.StorageException;
import com.cloudvault.model.FileMetadata;
import com.cloudvault.model.Folder;
import com.cloudvault.model.User;
import com.cloudvault.repository.FileRepository;
import com.cloudvault.repository.FolderRepository;
import com.cloudvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Metadata-level operations on files (rename, move, favorite, recents).
 * Byte I/O stays in {@link StorageService} so the storage backend can be
 * swapped (e.g. S3) without touching this service.
 */
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final FileMapper fileMapper;

    public FileResponse getFile(Long fileId) {
        return fileMapper.toResponse(require(fileId));
    }

    public FileResponse rename(Long fileId, String name) {
        if (name == null || name.isBlank()) {
            throw new StorageException("File name cannot be empty");
        }
        FileMetadata file = require(fileId);
        file.setName(name.trim());
        return fileMapper.toResponse(fileRepository.save(file));
    }

    public FileResponse move(Long fileId, Long targetFolderId) {
        User user = getCurrentUser();
        FileMetadata file = require(fileId);
        if (targetFolderId != null) {
            Folder target = folderRepository.findByIdAndOwnerId(targetFolderId, user.getId())
                    .orElseThrow(() -> new FileNotFoundException("Target folder not found"));
            file.setFolder(target);
        } else {
            file.setFolder(null);
        }
        return fileMapper.toResponse(fileRepository.save(file));
    }

    public FileResponse setFavorite(Long fileId, boolean favorite) {
        FileMetadata file = require(fileId);
        file.setFavorite(favorite);
        return fileMapper.toResponse(fileRepository.save(file));
    }

    // Records an access so the file surfaces in Recents. Best-effort: a failure
    // here must not block the actual view/download.
    public void touch(Long fileId) {
        fileRepository.findByIdAndOwnerId(fileId, getCurrentUser().getId())
                .ifPresent(file -> {
                    file.setLastAccessedAt(LocalDateTime.now());
                    fileRepository.save(file);
                });
    }

    public List<FileResponse> listFavorites() {
        return fileRepository.findByOwnerIdAndFavoriteTrue(getCurrentUser().getId())
                .stream().map(fileMapper::toResponse).toList();
    }

    public List<FileResponse> listRecents(int limit) {
        return fileRepository.findByOwnerId(getCurrentUser().getId()).stream()
                .sorted(Comparator.comparing(this::recencyOf).reversed())
                .limit(limit)
                .map(fileMapper::toResponse)
                .toList();
    }

    private LocalDateTime recencyOf(FileMetadata f) {
        LocalDateTime accessed = f.getLastAccessedAt();
        LocalDateTime uploaded = f.getUploadDate();
        if (accessed == null) return uploaded != null ? uploaded : LocalDateTime.MIN;
        if (uploaded == null) return accessed;
        return accessed.isAfter(uploaded) ? accessed : uploaded;
    }

    private FileMetadata require(Long fileId) {
        return fileRepository.findByIdAndOwnerId(fileId, getCurrentUser().getId())
                .orElseThrow(() -> new FileNotFoundException("File not found id: " + fileId));
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(username).orElseThrow();
    }
}
