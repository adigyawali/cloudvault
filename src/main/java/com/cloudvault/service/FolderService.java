package com.cloudvault.service;

import com.cloudvault.exception.FileNotFoundException;
import com.cloudvault.exception.StorageException;
import com.cloudvault.model.Folder;
import com.cloudvault.model.User;
import com.cloudvault.repository.FolderRepository;
import com.cloudvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    public Folder createFolder(String name, Long parentId) {
        User user = getCurrentUser();

        Folder folder = Folder.builder()
                .name(name)
                .owner(user)
                .build();

        if (parentId != null) {
            Folder parent = folderRepository.findByIdAndOwnerId(parentId, user.getId())
                    .orElseThrow(() -> new FileNotFoundException("Parent folder not found"));
            folder.setParent(parent);
        }

        return folderRepository.save(folder);
    }

    public List<Folder> listFolders(Long parentId) {
        User user = getCurrentUser();

        if (parentId != null) {
            return folderRepository.findByOwnerIdAndParentId(user.getId(), parentId);
        } else {
            return folderRepository.findByOwnerIdAndParentIsNull(user.getId());
        }
    }

    public Folder getFolder(Long folderId) {
        User user = getCurrentUser();
        return folderRepository.findByIdAndOwnerId(folderId, user.getId())
                .orElseThrow(() -> new FileNotFoundException("Folder not found"));
    }

    public Folder renameFolder(Long folderId, String name) {
        if (name == null || name.isBlank()) {
            throw new StorageException("Folder name cannot be empty");
        }
        Folder folder = getFolder(folderId);
        folder.setName(name.trim());
        return folderRepository.save(folder);
    }

    public Folder moveFolder(Long folderId, Long targetParentId) {
        Folder folder = getFolder(folderId);

        if (targetParentId == null) {
            folder.setParent(null);
            return folderRepository.save(folder);
        }
        if (targetParentId.equals(folderId)) {
            throw new StorageException("A folder cannot be moved into itself");
        }
        Folder target = getFolder(targetParentId);
        // Reject moving a folder into one of its own descendants (would orphan a cycle).
        for (Folder a = target; a != null; a = a.getParent()) {
            if (a.getId().equals(folderId)) {
                throw new StorageException("Cannot move a folder into one of its subfolders");
            }
        }
        folder.setParent(target);
        return folderRepository.save(folder);
    }

    public Folder setFavorite(Long folderId, boolean favorite) {
        Folder folder = getFolder(folderId);
        folder.setFavorite(favorite);
        return folderRepository.save(folder);
    }

    public List<Folder> listFavorites() {
        return folderRepository.findByOwnerIdAndFavoriteTrue(getCurrentUser().getId());
    }

    // Walks the parent chain to build a root-to-current breadcrumb trail.
    public List<Folder> getBreadcrumbs(Long folderId) {
        List<Folder> trail = new ArrayList<>();
        Folder current = getFolder(folderId);
        while (current != null) {
            trail.add(current);
            current = current.getParent();
        }
        Collections.reverse(trail);
        return trail;
    }

    public void deleteFolder(Long folderId) {
        User user = getCurrentUser();
        Folder folder = folderRepository.findByIdAndOwnerId(folderId, user.getId())
                .orElseThrow(() -> new FileNotFoundException("Folder not found"));
        // Clean disk for the whole subtree first; JPA cascade then removes the
        // folder, its subfolders, and all file metadata rows.
        storageService.deleteFilesUnderFolderTree(folderId);
        folderRepository.delete(folder);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(username).orElseThrow();
    }
}
