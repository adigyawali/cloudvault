package com.cloudvault.controller;

import com.cloudvault.dto.FavoriteRequest;
import com.cloudvault.dto.FileResponse;
import com.cloudvault.dto.MoveRequest;
import com.cloudvault.dto.RenameRequest;
import com.cloudvault.service.FileService;
import com.cloudvault.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final StorageService storageService;
    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<FileResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        return ResponseEntity.ok(storageService.store(file, folderId));
    }

    @GetMapping("/list")
    public ResponseEntity<List<FileResponse>> listFiles(
            @RequestParam(value = "folderId", required = false) Long folderId) {
        return ResponseEntity.ok(storageService.loadAll(folderId));
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<FileResponse>> listFavorites() {
        return ResponseEntity.ok(fileService.listFavorites());
    }

    @GetMapping("/recents")
    public ResponseEntity<List<FileResponse>> listRecents(
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(fileService.listRecents(limit));
    }

    // Single-file metadata. Lets the standalone viewer page work on a
    // deep link / refresh without needing the parent folder listing.
    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFile(@PathVariable Long id) {
        return ResponseEntity.ok(fileService.getFile(id));
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<FileResponse> renameFile(
            @PathVariable Long id, @RequestBody RenameRequest request) {
        return ResponseEntity.ok(fileService.rename(id, request.getName()));
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<FileResponse> moveFile(
            @PathVariable Long id, @RequestBody MoveRequest request) {
        return ResponseEntity.ok(fileService.move(id, request.getTargetFolderId()));
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<FileResponse> setFavorite(
            @PathVariable Long id, @RequestBody FavoriteRequest request) {
        return ResponseEntity.ok(fileService.setFavorite(id, request.isFavorite()));
    }

    @GetMapping("/download/{id}")
    @ResponseBody
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Resource file = storageService.loadAsResource(id);
        fileService.touch(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    // Serves the file inline (not as an attachment) so the frontend viewer can
    // render images/PDFs/text in-app. Same storage seam as download.
    @GetMapping("/view/{id}")
    @ResponseBody
    public ResponseEntity<Resource> viewFile(@PathVariable Long id) {
        Resource file = storageService.loadAsResource(id);
        fileService.touch(id);
        String contentType = storageService.getContentType(id);
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .contentType(mediaType)
                .body(file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        storageService.delete(id);
        return ResponseEntity.ok().build();
    }
}
