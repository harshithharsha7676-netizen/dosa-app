package com.dosa.ordering.controller;

import com.dosa.ordering.dto.DTOs;
import com.dosa.ordering.model.Order;
import com.dosa.ordering.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;

    @Value("${app.whatsapp.admin.number}")
    private String adminWhatsappNumber;

    @Value("${app.whatsapp.second.number:}")
    private String secondWhatsappNumber;

    @PostMapping("/client")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody DTOs.OrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.ok(Map.of(
            "order", order,
            "adminWhatsapp", adminWhatsappNumber,
            "secondWhatsapp", secondWhatsappNumber != null ? secondWhatsappNumber : ""
        ));
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/today")
    public ResponseEntity<List<Order>> getTodayOrders() {
        return ResponseEntity.ok(orderService.getTodayOrders());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DTOs.DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(orderService.getDashboardStats());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id, @RequestBody DTOs.OrderStatusUpdate update) {
        return ResponseEntity.ok(orderService.updateStatus(id, update.getStatus()));
    }

    // Get current next order number
    @GetMapping("/next-number")
    public ResponseEntity<Map<String, Object>> getNextNumber() {
        return ResponseEntity.ok(Map.of("nextNumber", orderService.getNextOrderNumber()));
    }

    // Set order number manually
    @PostMapping("/set-number")
    public ResponseEntity<Map<String, Object>> setNumber(@RequestBody DTOs.SetOrderNumberRequest req) {
        orderService.setNextOrderNumber(req.getStartFrom());
        return ResponseEntity.ok(Map.of(
            "message", "Order number set to " + req.getStartFrom(),
            "nextNumber", req.getStartFrom()
        ));
    }

    // Toggle paid/not-paid status
    @PutMapping("/{id}/paid")
    public ResponseEntity<Order> togglePaid(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.togglePaid(id));
    }
}
