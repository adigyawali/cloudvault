package com.cloudvault.service;

import com.cloudvault.dto.FileResponse;
import com.cloudvault.model.FileMetadata;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Single source of truth for FileMetadata -> FileResponse so storage and
 * metadata services stay consistent. The download URL is built from the
 * current request context, which keeps it correct behind the dev proxy.
 */
@Component
public class FileMapper {

    public FileResponse toResponse(FileMetadata metadata) {
        String downloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(metadata.getId().toString())
                .toUriString();

        return FileResponse.builder()
                .id(metadata.getId())
                .name(metadata.getName())
                .url(downloadUri)
                .type(metadata.getType())
                .size(metadata.getSize() != null ? metadata.getSize() : 0)
                .folderId(metadata.getFolder() != null ? metadata.getFolder().getId() : null)
                .favorite(metadata.isFavorite())
                .uploadDate(metadata.getUploadDate())
                .lastAccessedAt(metadata.getLastAccessedAt())
                .build();
    }
}
