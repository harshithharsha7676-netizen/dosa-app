package com.dosa.ordering.service;

import com.dosa.ordering.dto.DTOs;
import com.dosa.ordering.model.MenuItem;
import com.dosa.ordering.repository.MenuItemRepository;
import com.dosa.ordering.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class MenuItemService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public List<MenuItem> getAllItems() {
        return menuItemRepository.findAllByOrderByIdAsc();
    }

    public List<MenuItem> getAvailableItems() {
        // Return ALL items sorted by ID — client shows unavailable ones as disabled/sold-out
        return menuItemRepository.findAllByOrderByIdAsc();
    }

    public MenuItem createItem(DTOs.MenuItemRequest request, MultipartFile image) throws IOException {
        MenuItem item = new MenuItem();
        applyRequest(item, request);
        if (image != null && !image.isEmpty()) {
            item.setImageUrl(saveImage(image));
        }
        return menuItemRepository.save(item);
    }

    public MenuItem updateItem(Long id, DTOs.MenuItemRequest request, MultipartFile image) throws IOException {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));
        applyRequest(item, request);
        if (request.isResetImage()) {
            // Delete old file if on disk
            if (item.getImageUrl() != null) {
                try {
                    String fname = item.getImageUrl().replace("/uploads/", "");
                    Path oldFile = Paths.get(uploadDir).resolve(fname);
                    Files.deleteIfExists(oldFile);
                } catch (Exception ignored) {}
            }
            item.setImageUrl(null);
        } else if (image != null && !image.isEmpty()) {
            item.setImageUrl(saveImage(image));
        }
        return menuItemRepository.save(item);
    }

    public void toggleAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));
        item.setAvailable(!item.isAvailable());
        menuItemRepository.save(item);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteItem(Long id) {
        // Nullify the FK in any existing order_items so the delete succeeds
        // Historical orders keep their data intact — item name/price was already copied at order time
        orderItemRepository.nullifyMenuItemReference(id);
        menuItemRepository.deleteById(id);
    }

    public boolean isItemInUse(Long id) {
        return orderItemRepository.countByMenuItemId(id) > 0;
    }

    // ── Helpers ───────────────────────────────────────────────
    private void applyRequest(MenuItem item, DTOs.MenuItemRequest req) {
        item.setName(req.getName());
        item.setPrice(req.getPrice());
        item.setCategory(req.getCategory());
        item.setDescription(req.getDescription());
        item.setAvailable(req.isAvailable());
    }

    private String saveImage(MultipartFile image) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
        Files.copy(image.getInputStream(), uploadPath.resolve(filename));
        return "/uploads/" + filename;
    }
}
