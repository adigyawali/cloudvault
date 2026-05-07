package com.cloudvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderResponse {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    // null means this folder lives at the root level
    private Long parentId;
}
