package com.dosa.ordering.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id", nullable = true)
    private MenuItem menuItem;

    // Snapshot of item name at time of order — preserved even if item is deleted
    @Column(name = "item_name")
    private String itemName;

    @Column(nullable = false)
    private Integer quantity;

    // Per-item parcel flag — true means THIS specific item is parcel
    @Column(name = "is_parcel")
    private boolean parcel = false;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    // subtotal = (unitPrice * qty) + parcelCharge
    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;

    @Column(name = "parcel_charge")
    private BigDecimal parcelCharge = BigDecimal.ZERO;

    public OrderItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public boolean isParcel() { return parcel; }
    public void setParcel(boolean parcel) { this.parcel = parcel; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getParcelCharge() { return parcelCharge; }
    public void setParcelCharge(BigDecimal parcelCharge) { this.parcelCharge = parcelCharge; }
}
