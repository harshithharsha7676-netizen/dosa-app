export interface MenuItem {
  id: number; name: string; price: number; category: string;
  imageUrl: string | null; available: boolean; description: string | null;
  createdAt: string; updatedAt: string;
}

export interface MenuItemRequest {
  name: string; price: number; category: string; description: string; available: boolean;
}

export type OrderStatus = 'PENDING'|'CONFIRMED'|'PREPARING'|'READY'|'DELIVERED'|'CANCELLED';

export interface OrderItem {
  id: number;
  menuItem: MenuItem | null;   // null when item has been deleted
  itemName: string | null;     // snapshot of name at order time — always preserved
  quantity: number;
  parcel: boolean;           // per-item parcel flag
  unitPrice: number;
  parcelCharge: number;      // parcel charge for this item
  subtotal: number;          // food + parcel
}

export interface Order {
  id: number;
  dailyOrderNumber: number;  // resets daily, shown on receipt
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  parcel: boolean;
  parcelCharges: number;
  notes: string;
  paid: boolean;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOrderResponse {
  order: Order;
  adminWhatsapp: string;
  secondWhatsapp: string;
}

export interface OrderRequest {
  customerName: string; customerPhone: string; tableNumber: string;
  parcel: boolean; notes: string;
  items: { menuItemId: number; quantity: number; parcel: boolean }[];
}

export interface CartItem { menuItem: MenuItem; quantity: number; }
export interface LoginRequest  { username: string; password: string; }
export interface LoginResponse { success: boolean; message: string; username: string; }
export interface CheckResponse { loggedIn: boolean; username: string; }

export interface DashboardStats {
  totalOrders: number; todayOrders: number; todayRevenue: number;
  totalMenuItems: number; pendingOrders: number;
}
