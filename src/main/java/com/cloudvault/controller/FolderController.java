package com.cloudvault.controller;

import com.cloudvault.dto.FolderResponse;
import com.cloudvault.model.Folder;
import com.cloudvault.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping("/create")
    public ResponseEntity<FolderResponse> createFolder(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        Long parentId = payload.containsKey("parentId") ? Long.valueOf(payload.get("parentId").toString()) : null;
        return ResponseEntity.ok(mapToResponse(folderService.createFolder(name, parentId)));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return ResponseEntity.ok().build();
    }

    // Converts the Folder entity to a flat DTO — avoids serializing the bidirectional
    // parent/subFolders relationship which would cause an infinite JSON loop.
    private FolderResponse mapToResponse(Folder folder) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .createdAt(folder.getCreatedAt())
                // Hibernate stores the FK id in the proxy without hitting the DB, so this is safe
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .build();
    }
}
