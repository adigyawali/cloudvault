package com.cloudvault.repository;

import com.cloudvault.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    Optional<Folder> findByIdAndOwnerId(Long id, Long ownerId);
    List<Folder> findByOwnerIdAndParentId(Long ownerId, Long parentId);
    List<Folder> findByOwnerIdAndParentIsNull(Long ownerId); // Root folders
    List<Folder> findByOwnerIdAndFavoriteTrue(Long ownerId);
}
