package com.dosa.ordering.controller;

import com.dosa.ordering.dto.DTOs;
import com.dosa.ordering.model.MenuItem;
import com.dosa.ordering.service.MenuItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MenuItemController {

    @Autowired
    private MenuItemService menuItemService;

    @Autowired
    private ObjectMapper objectMapper;

    // ── Public ────────────────────────────────────────────────
    @GetMapping("/menu/public/items")
    public ResponseEntity<List<MenuItem>> getAvailableItems() {
        return ResponseEntity.ok(menuItemService.getAvailableItems());
    }

    // ── Admin ─────────────────────────────────────────────────
    @GetMapping("/menu/items")
    public ResponseEntity<List<MenuItem>> getAllItems() {
        return ResponseEntity.ok(menuItemService.getAllItems());
    }

    @PostMapping("/menu/items")
    public ResponseEntity<MenuItem> createItem(
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile image) throws Exception {
        DTOs.MenuItemRequest request = objectMapper.readValue(itemJson, DTOs.MenuItemRequest.class);
        return ResponseEntity.ok(menuItemService.createItem(request, image));
    }

    @PutMapping("/menu/items/{id}")
    public ResponseEntity<MenuItem> updateItem(
            @PathVariable Long id,
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile image) throws Exception {
        DTOs.MenuItemRequest request = objectMapper.readValue(itemJson, DTOs.MenuItemRequest.class);
        return ResponseEntity.ok(menuItemService.updateItem(id, request, image));
    }

    @PutMapping("/menu/items/{id}/toggle")
    public ResponseEntity<Void> toggleAvailability(@PathVariable Long id) {
        menuItemService.toggleAvailability(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/menu/items/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        try {
            menuItemService.deleteItem(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("ITEM_IN_USE")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "ITEM_IN_USE", "message", "This item has been ordered and cannot be deleted."));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "DELETE_FAILED", "message", e.getMessage()));
        }
    }

    // Check if item is used in any order (without deleting)
    @GetMapping("/menu/items/{id}/in-use")
    public ResponseEntity<Map<String, Object>> checkItemInUse(@PathVariable Long id) {
        boolean inUse = menuItemService.isItemInUse(id);
        return ResponseEntity.ok(Map.of("inUse", inUse));
    }
}
