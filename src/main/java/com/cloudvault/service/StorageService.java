package com.cloudvault.service;

import com.cloudvault.dto.FileResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Storage backend abstraction. The local-disk implementation is the default;
 * an S3-backed implementation can be added later as another bean (e.g.
 * activated by Spring profile) without touching controllers or services.
 */
public interface StorageService {

    FileResponse store(MultipartFile file, Long folderId);

    List<FileResponse> loadAll(Long folderId);

    Resource loadAsResource(Long fileId);

    /** MIME type recorded at upload time, used to serve previews inline. */
    String getContentType(Long fileId);

    void delete(Long fileId);

    /** Recursively removes the bytes + metadata of every file in a folder subtree. */
    void deleteFilesUnderFolderTree(Long folderId);
}
