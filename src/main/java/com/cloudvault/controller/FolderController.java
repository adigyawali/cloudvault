package com.cloudvault.controller;

import com.cloudvault.dto.FolderRequest;
import com.cloudvault.dto.FolderResponse;
import com.cloudvault.model.Folder;
import com.cloudvault.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping("/create")
    public ResponseEntity<FolderResponse> createFolder(@RequestBody FolderRequest request) {
        return ResponseEntity.ok(
                mapToResponse(folderService.createFolder(request.getName(), request.getParentId())));
    }

    @GetMapping("/list")
    public ResponseEntity<List<FolderResponse>> listFolders(
            @RequestParam(value = "parentId", required = false) Long parentId) {
        return ResponseEntity.ok(
                folderService.listFolders(parentId).stream()
                        .map(this::mapToResponse)
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FolderResponse> getFolder(@PathVariable Long id) {
        return ResponseEntity.ok(mapToResponse(folderService.getFolder(id)));
    }

    // Root-to-current trail used by the frontend breadcrumb. Survives deep links/refresh.
    @GetMapping("/{id}/path")
    public ResponseEntity<List<FolderResponse>> getFolderPath(@PathVariable Long id) {
        return ResponseEntity.ok(
                folderService.getBreadcrumbs(id).stream()
                        .map(this::mapToResponse)
                        .toList()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable Long id, @RequestBody FolderRequest request) {
        return ResponseEntity.ok(mapToResponse(folderService.renameFolder(id, request.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return ResponseEntity.ok().build();
    }

    // Flat DTO — avoids serializing the bidirectional parent/subFolders graph
    // which would otherwise cause an infinite JSON loop.
    private FolderResponse mapToResponse(Folder folder) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .createdAt(folder.getCreatedAt())
                // Hibernate keeps the FK id on the proxy, so this won't hit the DB
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .build();
    }
}
