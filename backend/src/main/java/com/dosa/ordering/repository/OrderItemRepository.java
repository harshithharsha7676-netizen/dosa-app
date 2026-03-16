package com.dosa.ordering.repository;

import com.dosa.ordering.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.menuItem.id = :menuItemId")
    long countByMenuItemId(@Param("menuItemId") Long menuItemId);

    /** Nullify the menu_item_id FK so the MenuItem row can be safely deleted */
    @Modifying
    @Query("UPDATE OrderItem oi SET oi.menuItem = null WHERE oi.menuItem.id = :menuItemId")
    void nullifyMenuItemReference(@Param("menuItemId") Long menuItemId);
}
