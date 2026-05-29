package com.cloudvault.repository;

import com.cloudvault.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FileRepository extends JpaRepository<FileMetadata, Long> {
    Optional<FileMetadata> findByIdAndOwnerId(Long id, Long ownerId);
    List<FileMetadata> findByOwnerIdAndFolderId(Long ownerId, Long folderId);
    List<FileMetadata> findByOwnerIdAndFolderIsNull(Long ownerId); // Root files
    List<FileMetadata> findByOwnerIdAndFavoriteTrue(Long ownerId);
    List<FileMetadata> findByOwnerId(Long ownerId); // Used for Recents (sorted in service)
}
