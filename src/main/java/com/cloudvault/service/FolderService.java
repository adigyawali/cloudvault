package com.cloudvault.service;

import com.cloudvault.exception.FileNotFoundException;
import com.cloudvault.model.Folder;
import com.cloudvault.model.User;
import com.cloudvault.repository.FolderRepository;
import com.cloudvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

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

    public void deleteFolder(Long folderId) {
        User user = getCurrentUser();
        Folder folder = folderRepository.findByIdAndOwnerId(folderId, user.getId())
                .orElseThrow(() -> new FileNotFoundException("Folder not found"));
        folderRepository.delete(folder);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(username).orElseThrow();
    }
}
