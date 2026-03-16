package com.dosa.ordering.repository;

import com.dosa.ordering.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startOfDay")
    Long countTodayOrders(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startOfDay AND o.status != 'CANCELLED'")
    BigDecimal sumTodayRevenue(@Param("startOfDay") LocalDateTime startOfDay);

    // Get max daily order number for today (for auto-increment)
    @Query("SELECT COALESCE(MAX(o.dailyOrderNumber), 0) FROM Order o WHERE o.createdAt >= :startOfDay")
    Integer getMaxDailyOrderNumber(@Param("startOfDay") LocalDateTime startOfDay);
}
