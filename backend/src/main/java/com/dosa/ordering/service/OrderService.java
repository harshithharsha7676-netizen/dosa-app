package com.dosa.ordering.service;

import com.dosa.ordering.dto.DTOs;
import com.dosa.ordering.model.MenuItem;
import com.dosa.ordering.model.Order;
import com.dosa.ordering.model.OrderItem;
import com.dosa.ordering.repository.MenuItemRepository;
import com.dosa.ordering.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OrderService {

    private static final BigDecimal PARCEL_CHARGE_PER_ITEM = new BigDecimal("5");

    // Manual override for daily order number
    private final AtomicInteger manualNextNumber = new AtomicInteger(-1);
    private String manualSetDate = "";

    @Autowired private OrderRepository orderRepository;
    @Autowired private MenuItemRepository menuItemRepository;

    @Transactional
    public Order createOrder(DTOs.OrderRequest request) {
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setTableNumber(request.getTableNumber());
        order.setNotes(request.getNotes());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal itemsTotal = BigDecimal.ZERO;
        BigDecimal totalParcelCharges = BigDecimal.ZERO;
        int totalQty = 0;
        boolean anyParcel = false;

        for (DTOs.OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemReq.getMenuItemId()));

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setMenuItem(menuItem);
            oi.setItemName(menuItem.getName()); // snapshot — preserved even if item deleted
            oi.setQuantity(itemReq.getQuantity());
            oi.setUnitPrice(menuItem.getPrice());

            BigDecimal foodSubtotal = menuItem.getPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            // Mark item as parcel regardless of category (user set it parcel)
            // But only apply ₹5 charge for non-Beverage items
            boolean itemIsParcel = itemReq.isParcel();
            boolean chargeParcel = itemIsParcel
                    && !"Beverages".equalsIgnoreCase(menuItem.getCategory());

            BigDecimal itemParcelCharge = chargeParcel
                    ? PARCEL_CHARGE_PER_ITEM.multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    : BigDecimal.ZERO;

            oi.setParcel(itemIsParcel);          // show in parcel section on receipt
            oi.setParcelCharge(itemParcelCharge); // ₹0 for beverages even if parcel
            oi.setSubtotal(foodSubtotal.add(itemParcelCharge));

            orderItems.add(oi);
            itemsTotal = itemsTotal.add(foodSubtotal);
            totalParcelCharges = totalParcelCharges.add(itemParcelCharge);
            totalQty += itemReq.getQuantity();
            if (itemIsParcel) anyParcel = true;
        }

        order.setParcel(anyParcel);
        order.setParcelCharges(totalParcelCharges);
        order.setTotalAmount(itemsTotal.add(totalParcelCharges));
        order.setTotalItems(totalQty);
        order.setOrderItems(orderItems);

        // Assign daily order number
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        String today = LocalDate.now().toString();

        int nextNumber;
        if (manualNextNumber.get() > 0 && manualSetDate.equals(today)) {
            nextNumber = manualNextNumber.getAndIncrement();
        } else {
            Integer maxToday = orderRepository.getMaxDailyOrderNumber(startOfDay);
            nextNumber = (maxToday == null ? 0 : maxToday) + 1;
            manualNextNumber.set(-1);
        }
        order.setDailyOrderNumber(nextNumber);

        return orderRepository.save(order);
    }

    public void setNextOrderNumber(int startFrom) {
        manualNextNumber.set(startFrom);
        manualSetDate = LocalDate.now().toString();
    }

    public int getNextOrderNumber() {
        String today = LocalDate.now().toString();
        if (manualNextNumber.get() > 0 && manualSetDate.equals(today)) {
            return manualNextNumber.get();
        }
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Integer max = orderRepository.getMaxDailyOrderNumber(startOfDay);
        return (max == null ? 0 : max) + 1;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getTodayOrders() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1).minusNanos(1);
        return orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay);
    }

    public Order updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(Order.OrderStatus.valueOf(status));
        return orderRepository.save(order);
    }

    public Order togglePaid(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setPaid(!order.isPaid());
        return orderRepository.save(order);
    }

    public DTOs.DashboardStats getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        DTOs.DashboardStats stats = new DTOs.DashboardStats();
        stats.setTotalOrders(orderRepository.count());
        stats.setTodayOrders(orderRepository.countTodayOrders(startOfDay));
        stats.setTodayRevenue(orderRepository.sumTodayRevenue(startOfDay));
        stats.setTotalMenuItems(menuItemRepository.count());
        stats.setPendingOrders(orderRepository.findByStatus(Order.OrderStatus.PENDING).size());
        return stats;
    }
}
