package com.dosa.ordering.dto;

import java.math.BigDecimal;
import java.util.List;

public class DTOs {

    public static class MenuItemRequest {
        private String name;
        private BigDecimal price;
        private String category;
        private String description;
        private boolean available = true;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        private boolean resetImage = false;

        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
        public boolean isResetImage() { return resetImage; }
        public void setResetImage(boolean resetImage) { this.resetImage = resetImage; }
    }

    public static class OrderRequest {
        private String customerName;
        private String customerPhone;
        private String tableNumber;
        private boolean parcel; // kept for backward compat but per-item takes priority
        private String notes;
        private List<OrderItemRequest> items;

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        public String getTableNumber() { return tableNumber; }
        public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
        public boolean isParcel() { return parcel; }
        public void setParcel(boolean parcel) { this.parcel = parcel; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public List<OrderItemRequest> getItems() { return items; }
        public void setItems(List<OrderItemRequest> items) { this.items = items; }
    }

    public static class OrderItemRequest {
        private Long menuItemId;
        private Integer quantity;
        private boolean parcel = false; // per-item parcel flag

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public boolean isParcel() { return parcel; }
        public void setParcel(boolean parcel) { this.parcel = parcel; }
    }

    public static class LoginRequest {
        private String username;
        private String password;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private boolean success;
        private String message;
        private String username;
        public LoginResponse(boolean success, String message, String username) {
            this.success = success; this.message = message; this.username = username;
        }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getUsername() { return username; }
    }

    public static class DashboardStats {
        private long totalOrders;
        private long todayOrders;
        private BigDecimal todayRevenue;
        private long totalMenuItems;
        private long pendingOrders;

        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long v) { this.totalOrders = v; }
        public long getTodayOrders() { return todayOrders; }
        public void setTodayOrders(long v) { this.todayOrders = v; }
        public BigDecimal getTodayRevenue() { return todayRevenue; }
        public void setTodayRevenue(BigDecimal v) { this.todayRevenue = v; }
        public long getTotalMenuItems() { return totalMenuItems; }
        public void setTotalMenuItems(long v) { this.totalMenuItems = v; }
        public long getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(long v) { this.pendingOrders = v; }
    }

    public static class OrderStatusUpdate {
        private String status;
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class SetOrderNumberRequest {
        private int startFrom;
        public int getStartFrom() { return startFrom; }
        public void setStartFrom(int startFrom) { this.startFrom = startFrom; }
    }
}
