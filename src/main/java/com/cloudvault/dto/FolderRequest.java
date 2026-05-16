package com.cloudvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderRequest {
    private String name;
    // null creates the folder at the root level
    private Long parentId;
}
