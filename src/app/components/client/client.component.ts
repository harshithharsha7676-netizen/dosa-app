import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuService }  from '../../services/menu.service';
import { OrderService } from '../../services/order.service';
import { CartService, CartLine } from '../../services/cart.service';
import { AuthService }  from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { MenuItem, Order } from '../../models/models';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

export interface NumberedMenuItem extends MenuItem { serialNo: number; }

const NO_CHARGE_CATS = ['beverages', 'drinks', 'water'];
const PROTECTED_CATS = ['Butter Dosa', 'Schezwan Dosa', 'Cheese Dosa'];

type SettingTab = 'general' | 'menu' | 'admin';
type MenuGate   = 'pin' | 'fp_phone' | 'fp_otp' | 'fp_reset' | 'open';
type AppView    = 'ordering' | 'success';
type AdminView  = 'login' | 'forgot' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit, OnDestroy {

  appView: AppView = 'ordering';

  allItems:     NumberedMenuItem[] = [];
  groupedItems: { category: string; items: NumberedMenuItem[] }[] = [];
  categories:   string[] = [];
  selectedCat   = 'ALL';
  loading       = true;

  searchQuery    = '';
  searchResults: NumberedMenuItem[] = [];
  isSearching    = false;

  cartLines:  CartLine[] = [];
  cartOpen    = false;
  placing     = false;
  parcelFirst = true;

  customerName  = '';
  customerPhone = '';
  tableNumber   = '';
  notes         = '';

  placedOrder: Order | null = null;
  adminWA     = '917676666246';
  waNumber2   = '';
  waSent      = false;

  settingsOpen = false;
  settingTab: SettingTab = 'general';

  orderNumInput = 1;
  nextOrderNum  = 1;
  extraWAInput  = '';
  savedExtraWA  = '';

  parcelRates:     Record<string, number> = {};
  editingParcelCat = '';
  editingParcelVal: number | null = null;

  menuSections:      string[] = [];
  editSection        = '';
  editItems:         NumberedMenuItem[] = [];
  filteredEditItems: NumberedMenuItem[] = [];
  editingItem:       NumberedMenuItem | null = null;
  newName            = '';
  newPrice: number | null = null;
  newCat             = '';
  isNewCategory      = false;
  menuSearchQuery    = '';
  menuSearchAllResults: NumberedMenuItem[] = [];
  menuSearchAllMode  = false;

  menuGate: MenuGate = 'pin';
  pinDigits: string[] = [];
  pinShake   = false;
  pinSuccess = false;
  readonly DEFAULT_PIN = '1234';
  fpPhone = ''; fpOtp = ''; fpNewPin = ''; fpConfirm = '';
  fpLoading = false; fpError = ''; fpSuccess = '';

  // Admin login (inside settings)
  adminView: AdminView = 'login';
  adminUsername  = '';
  adminPassword  = '';
  adminShowPw    = false;
  adminLoggedIn  = false;
  adminUser      = '';
  adminError     = '';
  adminLoading   = false;
  adminFpPhone = ''; adminFpOtp = ''; adminFpNew = ''; adminFpConfirm = '';
  adminFpLoading = false; adminFpError = ''; adminFpSuccess = '';

  readonly PROTECTED_CATS = PROTECTED_CATS;

  private sub!: Subscription;
  private authSub!: Subscription;
  private api      = environment.apiUrl;
  readonly apiBase = environment.apiUrl.replace('/api', '');

  constructor(
    private menuSvc:  MenuService,
    private orderSvc: OrderService,
    public  cartSvc:  CartService,
    private authSvc:  AuthService,
    private toast:    ToastService,
    private http:     HttpClient
  ) {}

  ngOnInit(): void {
    this.loadMenu();
    this.loadSettings();
    this.fetchNextNum();
    this.sub = this.cartSvc.cart$.subscribe(lines => { this.cartLines = lines; });
    this.authSub = this.authSvc.isLoggedIn$.subscribe(ok => {
      this.adminLoggedIn = ok;
      this.adminUser = this.authSvc.getUsername();
      if (ok) this.adminView = 'done';
    });
    this.authSvc.checkSession();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); this.authSub?.unsubscribe(); }

  loadSettings(): void {
    this.savedExtraWA = localStorage.getItem('dosa_wa2') || '';
    this.extraWAInput = this.savedExtraWA.replace(/^91/, '');
    this.parcelFirst  = localStorage.getItem('dosa_parcelFirst') !== 'false';
    this.waNumber2    = this.savedExtraWA.replace(/^91/, '');
    const s = localStorage.getItem('dosa_parcelRates');
    this.parcelRates  = s ? JSON.parse(s) : {};
  }

  getParcelRate(cat: string): number {
    const k = (cat || '').toLowerCase();
    return k in this.parcelRates ? this.parcelRates[k] : (NO_CHARGE_CATS.includes(k) ? 0 : 5);
  }

  startEditParcel(cat: string): void { this.editingParcelCat = cat; this.editingParcelVal = this.getParcelRate(cat); }
  saveParcelRate(): void {
    if (this.editingParcelVal == null) return;
    this.parcelRates[this.editingParcelCat.toLowerCase()] = Number(this.editingParcelVal);
    localStorage.setItem('dosa_parcelRates', JSON.stringify(this.parcelRates));
    this.editingParcelCat = ''; this.editingParcelVal = null;
    this.toast.success?.('Parcel charge updated!');
  }
  cancelEditParcel(): void { this.editingParcelCat = ''; this.editingParcelVal = null; }

  saveGeneralSettings(): void {
    const raw = this.extraWAInput.replace(/\D/g, '');
    this.savedExtraWA = raw ? (raw.startsWith('91') ? raw : '91' + raw) : '';
    this.extraWAInput = this.savedExtraWA.replace(/^91/, '');
    localStorage.setItem('dosa_wa2', this.savedExtraWA);
    localStorage.setItem('dosa_parcelFirst', String(this.parcelFirst));
    this.http.post<any>(`${this.api}/orders/set-number`, { startFrom: this.orderNumInput })
      .subscribe({
        next: r => { this.nextOrderNum = r.nextNumber; this.settingsOpen = false; this.toast.success?.('Settings saved!'); },
        error: () => this.settingsOpen = false
      });
  }

  fetchNextNum(): void {
    this.http.get<any>(`${this.api}/orders/next-number`)
      .subscribe({ next: r => { this.nextOrderNum = r.nextNumber; this.orderNumInput = r.nextNumber; }, error: () => {} });
  }

  loadMenu(): void {
    this.loading = true;
    this.menuSvc.getAvailableItems().subscribe({
      next: items => {
        // ── Serial number logic: group by category (ordered by earliest item ID),
        //    sort items within each category by ID, then number sequentially
        const catMinId = new Map<string, number>();
        items.forEach(it => {
          const cat = it.category || 'Other';
          const cur = catMinId.get(cat);
          if (cur === undefined || it.id < cur) catMinId.set(cat, it.id);
        });
        const catOrder = Array.from(catMinId.entries())
          .sort((a, b) => a[1] - b[1]).map(e => e[0]);
        const grouped = new Map<string, typeof items>();
        catOrder.forEach(c => grouped.set(c, []));
        items.forEach(it => {
          const cat = it.category || 'Other';
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(it);
        });
        grouped.forEach(arr => arr.sort((a, b) => a.id - b.id));
        const sorted: typeof items = [];
        catOrder.forEach(c => sorted.push(...(grouped.get(c) || [])));
        this.allItems = sorted.map((it, i) => ({ ...it, serialNo: i + 1 }));
        const seen = new Set<string>(); this.categories = [];
        catOrder.forEach(c => { if (!seen.has(c)) { seen.add(c); this.categories.push(c); } });
        this.menuSections = [...this.categories];
        this.applyFilter(this.categories.includes(this.selectedCat) ? this.selectedCat : 'ALL');
        this.loading = false;
      },
      error: () => { this.toast.error('Cannot connect to server.'); this.loading = false; }
    });
  }

  applyFilter(cat: string): void {
    this.selectedCat = cat; this.clearSearch();
    const list = cat === 'ALL' ? this.allItems : this.allItems.filter(i => i.category === cat);
    const map = new Map<string, NumberedMenuItem[]>();
    list.forEach(it => { const c = it.category || 'Other'; if (!map.has(c)) map.set(c, []); map.get(c)!.push(it); });
    this.groupedItems = Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) { this.isSearching = false; this.searchResults = []; return; }
    this.isSearching = true;
    this.searchResults = this.allItems.filter(it =>
      it.name.toLowerCase().includes(q) || it.serialNo.toString() === q.replace('#', '')
    );
  }
  clearSearch(): void { this.searchQuery = ''; this.isSearching = false; this.searchResults = []; }

  totalQtyFor(item: MenuItem): number  { return this.cartSvc.getTotalQtyForItem(item.id); }
  parcelQtyFor(item: MenuItem): number { return this.cartSvc.getParcelQty(item.id); }
  dineInQtyFor(item: MenuItem): number { return this.cartSvc.getDineInQty(item.id); }

  addParcel(item: MenuItem): void { this.cartSvc.addLine(item, true); }
  addDineIn(item: MenuItem): void { this.cartSvc.addLine(item, false); }
  remParcel(item: MenuItem): void { this.cartSvc.removeLine(item.id, true); }
  remDineIn(item: MenuItem): void { this.cartSvc.removeLine(item.id, false); }
  delLine(key: string): void      { this.cartSvc.deleteLine(key); }

  get parcelLines(): CartLine[] { return this.cartLines.filter(l => l.isParcel); }
  get dineInLines(): CartLine[] { return this.cartLines.filter(l => !l.isParcel); }

  get displayedSections(): { label: string; tag: string; lines: CartLine[] }[] {
    const P = { label: '📦 PARCEL',  tag: 'parcel', lines: this.parcelLines };
    const D = { label: '🪑 DINE-IN', tag: 'dinein', lines: this.dineInLines };
    return (this.parcelFirst ? [P, D] : [D, P]).filter(s => s.lines.length > 0);
  }

  get totalQty(): number     { return this.cartLines.reduce((s, l) => s + l.quantity, 0); }
  get foodSubtotal(): number { return this.cartLines.reduce((s, l) => s + this.n(l.menuItem.price) * l.quantity, 0); }
  get parcelCharge(): number {
    return this.parcelLines.reduce((s, l) => s + l.quantity * this.getParcelRate(l.menuItem.category || ''), 0);
  }
  get grandTotal(): number { return this.foodSubtotal + this.parcelCharge; }

  lineTotal(l: CartLine): number {
    const food = this.n(l.menuItem.price) * l.quantity;
    if (!l.isParcel) return food;
    return food + l.quantity * this.getParcelRate(l.menuItem.category || '');
  }
  lineSub(l: CartLine): string {
    const food = `${l.quantity}×₹${this.n(l.menuItem.price)}`;
    if (!l.isParcel) return food;
    const rate = this.getParcelRate(l.menuItem.category || '');
    return rate > 0 ? `${food} +₹${l.quantity * rate} pkg` : `${food} (no pkg charge)`;
  }

  serialOf(id: number): number { return this.allItems.find(i => i.id === id)?.serialNo ?? 0; }
  imgUrl(p: string | null | undefined): string {
    if (!p) return '';
    if (p.startsWith('http') || p.startsWith('data:') || p.startsWith('blob:')) return p;
    // Strip any accidental double slashes
    const base = this.apiBase.replace(/\/+$/, '');
    const path = ('/' + p.replace(/^\/+/, ''));
    return base + path;
  }
  toggleCart(): void  { this.cartOpen = !this.cartOpen; }
  closePanel(): void  { this.cartOpen = false; this.settingsOpen = false; }
  isProtected(cat: string | null): boolean { return PROTECTED_CATS.includes(cat || ''); }

  placeOrder(): void {
    if (!this.customerName.trim()) { this.toast.error('Please enter your name'); return; }
    if (!this.cartLines.length)    { this.toast.error('Cart is empty'); return; }
    this.placing = true;
    this.orderSvc.placeOrder({
      customerName:  this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      tableNumber:   this.tableNumber.trim(),
      parcel:        this.parcelLines.length > 0,
      notes:         this.notes.trim(),
      items: this.cartLines.map(l => ({ menuItemId: l.menuItem.id, quantity: l.quantity, parcel: l.isParcel }))
    }).subscribe({
      next: res => {
        this.placedOrder  = res.order;
        this.adminWA      = res.adminWhatsapp || '917676666246';
        const saved       = this.savedExtraWA || localStorage.getItem('dosa_wa2') || '';
        if (!this.waNumber2 && saved) this.waNumber2 = saved.replace(/^91/, '');
        this.waSent       = false;
        this.appView      = 'success';
        this.cartOpen     = false;
        this.settingsOpen = false;
        this.placing      = false;
        this.cartSvc.clear();
        this.fetchNextNum();
        this.customerName = ''; this.customerPhone = ''; this.tableNumber = ''; this.notes = '';
        setTimeout(() => { this.loadMenu(); }, 400);
      },
      error: () => { this.toast.error('Failed to place order.'); this.placing = false; }
    });
  }

  // Opens WhatsApp native app directly — no web preview, no draft screen
  private waOpen(phone: string, text: string): void {
    const encoded = encodeURIComponent(text);
    // Use window.open so page doesn't navigate away — both links can fire immediately
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  }

  sendWhatsApp(): void {
    if (!this.placedOrder) return;
    const msg  = this.buildMsg(this.placedOrder);
    const raw2 = this.waNumber2.replace(/\D/g, '');
    const num2 = raw2 ? (raw2.startsWith('91') ? raw2 : '91' + raw2) : '';
    if (num2) { this.savedExtraWA = num2; localStorage.setItem('dosa_wa2', num2); }
    // Open both simultaneously — window.open doesn't navigate away
    this.waOpen(this.adminWA, msg);
    if (num2) this.waOpen(num2, msg);
    this.waSent = true;
  }
  wa1(): void {
    if (!this.placedOrder) return;
    this.waOpen(this.adminWA, this.buildMsg(this.placedOrder));
  }
  wa2(): void {
    if (!this.placedOrder) return;
    const raw = this.waNumber2.replace(/\D/g, '');
    const num = raw ? (raw.startsWith('91') ? raw : '91' + raw) : this.savedExtraWA;
    if (!num) { this.toast.error('Enter a second number.'); return; }
    this.waOpen(num, this.buildMsg(this.placedOrder));
  }

  buildMsg(o: Order): string {
    const pi = o.orderItems.filter(oi =>  oi.parcel);
    const di = o.orderItems.filter(oi => !oi.parcel);
    const pc = this.n(o.parcelCharges);

    const sections = this.parcelFirst
      ? [{ label: '📦 PARCEL', items: pi }, { label: '🪑 DINE-IN', items: di }]
      : [{ label: '🪑 DINE-IN', items: di }, { label: '📦 PARCEL', items: pi }];

    let m = '';
    m += `🍛 *Famous 99 Variety Dosa*\n`;
    m += `━━━━━━━━━━━━━━━━━\n`;
    m += `*Order #${o.dailyOrderNumber}*\n`;
    m += `👤 Name   : ${o.customerName}\n`;
    if (o.customerPhone) m += `📞 Phone  : ${o.customerPhone}\n`;
    if (o.tableNumber)   m += `🪑 Table  : ${o.tableNumber}\n`;
    if (o.notes)         m += `📝 Notes  : ${o.notes}\n`;
    m += `━━━━━━━━━━━━━━━━━\n`;

    for (const sec of sections) {
      if (!sec.items.length) continue;
      m += `*${sec.label}*\n`;
      sec.items.forEach((oi, i) => {
        const name = oi.itemName || oi.menuItem?.name || '—';
        const amt  = this.n(oi.unitPrice) * oi.quantity;
        m += `  ${i + 1}. ${name}\n`;
        m += `     Qty: ${oi.quantity}  |  ₹${amt}\n`;
      });
      const secParcelCharge = sec.items.reduce((s, oi) => s + this.n(oi.parcelCharge), 0);
      if (secParcelCharge > 0) m += `  + Parcel charges: ₹${secParcelCharge}\n`;
      m += `\n`;
    }

    m += `━━━━━━━━━━━━━━━━━\n`;
    if (pc > 0) {
      m += `Food Total    : ₹${this.n(o.totalAmount) - pc}\n`;
      m += `Parcel Charges: ₹${pc}\n`;
    }
    m += `*GRAND TOTAL  : ₹${this.n(o.totalAmount)}*\n`;
    m += `━━━━━━━━━━━━━━━━━\n`;
    m += `🕐 ${new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}`;
    return m;
  }

  printReceipt(): void {
    if (!this.placedOrder) return;
    const o = this.placedOrder, now = new Date().toLocaleString('en-IN'), pc = this.n(o.parcelCharges);
    const makeRows = (items: any[], label: string) => {
      if (!items.length) return '';
      const rows = items.map((oi, i) =>
        `<tr><td>${i+1}</td><td>${(oi.itemName || oi.menuItem?.name) ?? ''}</td><td align="center">${oi.quantity}</td><td align="right">₹${this.n(oi.unitPrice)}</td><td align="right">₹${this.n(oi.unitPrice)*oi.quantity}</td></tr>`
      ).join('');
      return `<tr class="sh"><td colspan="5">${label}</td></tr>${rows}`;
    };
    const pi   = o.orderItems.filter(oi => oi.parcel);
    const di   = o.orderItems.filter(oi => !oi.parcel);
    const body = this.parcelFirst
      ? makeRows(pi, '📦 PARCEL') + makeRows(di, '🪑 DINE-IN')
      : makeRows(di, '🪑 DINE-IN') + makeRows(pi, '📦 PARCEL');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order #${o.dailyOrderNumber}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@700&family=Nunito:wght@800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11.5px;width:80mm;padding:8px 10px}.c{text-align:center}.b{font-weight:bold}.d{border-top:1px dashed #000;margin:6px 0}.god{font-family:'Noto Sans Kannada',sans-serif;font-size:12px;font-weight:400;margin-bottom:3px;text-align:center;display:block;letter-spacing:.5px;color:#555}.brand{font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;text-align:center;margin-bottom:1px;letter-spacing:-.2px}.meta{font-size:11px;margin:3px 0;line-height:1.4}table{width:100%;border-collapse:collapse;margin:4px 0}th{border-bottom:1.5px solid #000;padding:4px 3px;font-size:10px;text-align:left}td{padding:3px 3px;font-size:11px;vertical-align:top}.sh td{font-weight:bold;background:#EBEBEB;padding:5px 3px;font-size:11px;letter-spacing:.2px}.tot td{font-weight:bold;border-top:2px solid #000;padding-top:5px;font-size:12px}.footer{text-align:center;font-size:11px;margin-top:8px;border-top:1px dashed #000;padding-top:6px}</style></head><body><div class="god">ಶ್ರೀ ಕಬ್ಬಾಳಮ್ಮ</div><div class="brand">Famous 99 Variety Dosa</div><div class="d"></div><div class="meta"><span class="b">Order #${o.dailyOrderNumber}</span> &nbsp;&nbsp; ${now}</div><div class="meta"><span class="b">Name :</span> ${o.customerName}${o.customerPhone?' &nbsp; <span class="b">Ph :</span> '+o.customerPhone:''}</div>${o.tableNumber?`<div class="meta"><span class="b">Table:</span> ${o.tableNumber}</div>`:''}${o.notes?`<div class="meta"><span class="b">Notes:</span> ${o.notes}</div>`:''}<div class="d"></div><table><thead><tr><th>#</th><th>Item</th><th align="center">Qty</th><th align="right">Rate</th><th align="right">Amt</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="4" align="right">Food Total</td><td align="right">₹${this.n(o.totalAmount)-pc}</td></tr>${pc>0?`<tr><td colspan="4" align="right">Parcel Charges</td><td align="right">₹${pc}</td></tr>`:''}<tr class="tot"><td colspan="4" align="right"><b>GRAND TOTAL</b></td><td align="right"><b>₹${this.n(o.totalAmount)}</b></td></tr></tfoot></table><div class="footer">Thank you for visiting!<br/>Please come again 🙏</div></body></html>`;
    const w = window.open('', '_blank', 'width=420,height=620');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 500); }
  }

  continueOrdering(): void {
    this.appView = 'ordering'; this.placedOrder = null; this.waSent = false;
    this.waNumber2 = this.savedExtraWA.replace(/^91/, '');
    this.loadMenu();
  }

  // Opens the main menu, then immediately opens Settings → Admin tab for login
  goToAdminLogin(): void {
    this.appView      = 'ordering';
    this.placedOrder  = null;
    this.waSent       = false;
    this.waNumber2    = this.savedExtraWA.replace(/^91/, '');
    this.loadMenu();
    this.settingsOpen = true;
    this.settingTab   = 'admin';
    this.openAdminTab();
  }

  // ── Menu tab ─────────────────────────────────────────────
  openMenuTab(): void {
    this.settingTab = 'menu'; this.menuGate = 'pin'; this.pinDigits = [];
    this.pinShake = false; this.pinSuccess = false;
    this.fpError = ''; this.fpSuccess = ''; this.fpPhone = ''; this.fpOtp = ''; this.fpNewPin = ''; this.fpConfirm = '';
  }

  pinTap(d: string): void {
    if (this.pinDigits.length >= 4 || this.pinSuccess) return;
    this.pinDigits = [...this.pinDigits, d]; this.pinShake = false;
    if (this.pinDigits.length === 4) setTimeout(() => this.checkPin(), 120);
  }
  pinBackspace(): void {
    if (!this.pinDigits.length || this.pinSuccess) return;
    this.pinDigits = this.pinDigits.slice(0, -1); this.pinShake = false;
  }

  checkPin(): void {
    const stored = localStorage.getItem('dosa_menu_pin') || this.DEFAULT_PIN;
    if (this.pinDigits.join('') === stored) {
      this.pinSuccess = true;
      setTimeout(() => { this.menuGate = 'open'; }, 700);
    } else {
      this.pinShake = true; this.pinDigits = [];
      setTimeout(() => { this.pinShake = false; }, 600);
    }
  }

  startForgotPin(): void {
    this.menuGate = 'fp_phone';
    this.fpPhone=''; this.fpOtp=''; this.fpNewPin=''; this.fpConfirm=''; this.fpError=''; this.fpSuccess=''; this.fpLoading=false;
  }

  sendPinOtp(): void {
    const ph = this.fpPhone.replace(/\D/g, '');
    if (ph.length < 10) { this.fpError = 'Enter a valid 10-digit phone'; return; }
    this.fpLoading = true; this.fpError = '';
    this.http.post<any>(`${this.api}/auth/otp/generate`, { phone: ph }).subscribe({
      next: res => {
        this.waOpen(this.adminWA, `Your Dosa PIN OTP: *${res.otp}*\nValid 5 minutes.`);
        this.menuGate = 'fp_otp'; this.fpLoading = false;
      },
      error: () => { this.fpError = 'Server error.'; this.fpLoading = false; }
    });
  }

  verifyPinOtp(): void {
    if (!this.fpOtp.trim()) { this.fpError = 'Enter the OTP'; return; }
    this.fpLoading = true; this.fpError = '';
    this.http.post<any>(`${this.api}/auth/otp/verify`, { phone: this.fpPhone.replace(/\D/g,''), otp: this.fpOtp.trim() }).subscribe({
      next: res => { if (res.valid) this.menuGate = 'fp_reset'; else this.fpError = res.reason||'Invalid OTP.'; this.fpLoading = false; },
      error: () => { this.fpError = 'Server error.'; this.fpLoading = false; }
    });
  }

  saveNewPin(): void {
    if (!/^\d{4}$/.test(this.fpNewPin)) { this.fpError = 'PIN must be 4 digits'; return; }
    if (this.fpNewPin !== this.fpConfirm) { this.fpError = 'PINs do not match'; return; }
    localStorage.setItem('dosa_menu_pin', this.fpNewPin);
    this.fpSuccess = '✅ PIN changed!';
    setTimeout(() => {
      this.menuGate='pin'; this.pinDigits=[]; this.pinShake=false; this.pinSuccess=false;
      this.fpSuccess=''; this.fpNewPin=''; this.fpConfirm='';
    }, 1800);
  }

  openSection(sec: string): void {
    this.editSection = sec; this.isNewCategory = false;
    this.editItems   = this.allItems.filter(i => i.category === sec);
    this.filteredEditItems = [...this.editItems];
    this.newName = ''; this.newPrice = null; this.newCat = sec; this.editingItem = null; this.menuSearchQuery = '';
  }

  applyMenuSearch(): void {
    const q = this.menuSearchQuery.trim().toLowerCase();
    if (!q) {
      this.menuSearchAllMode = false; this.menuSearchAllResults = []; this.filteredEditItems = [...this.editItems];
    } else {
      this.menuSearchAllMode = true;
      this.menuSearchAllResults = this.allItems.filter(it =>
        it.name.toLowerCase().includes(q) || it.serialNo.toString().includes(q) || (it.category || '').toLowerCase().includes(q)
      );
      this.filteredEditItems = this.editItems.filter(it =>
        it.name.toLowerCase().includes(q) || it.serialNo.toString().includes(q)
      );
    }
  }

  addItem(): void {
    const name = this.newName.trim(), price = this.newPrice;
    const cat = this.editSection === '__new__' ? this.newCat.trim() : this.editSection;
    if (!name || !price || !cat) { this.toast.error('Name, price and category required'); return; }
    const form = new FormData();
    form.append('item', new Blob([JSON.stringify({ name, price, category: cat, description: '', available: true })], { type: 'application/json' }));
    this.http.post<any>(`${this.api}/menu/items`, form).subscribe({
      next: () => {
        this.toast.success?.('Item added!'); this.newName = ''; this.newPrice = null;
        const wasNew = this.editSection === '__new__';
        // Reload immediately — serial numbers recompute across ALL categories
        this.loadMenu();
        setTimeout(() => { this.openSection(cat); if (wasNew) this.isNewCategory = true; }, 350);
      },
      error: e => this.toast.error(e.status === 403 ? 'Admin login required.' : 'Failed to add item.')
    });
  }

  startEdit(item: NumberedMenuItem): void { this.editingItem = { ...item }; }
  cancelEdit(): void { this.editingItem = null; }

  quickToggle(item: NumberedMenuItem): void {
    this.http.put<any>(`${this.api}/menu/items/${item.id}/toggle`, {}).subscribe({
      next: () => {
        item.available = !item.available;
        this.toast.success?.(item.available ? `"${item.name}" is now Available ✅` : `"${item.name}" marked Sold Out ⛔`);
        this.loadMenu();
        setTimeout(() => { if (this.editSection && this.editSection !== '__new__') this.openSection(this.editSection); this.applyMenuSearch(); }, 500);
      },
      error: () => this.toast.error('Failed to update.')
    });
  }

  saveEdit_direct(item: NumberedMenuItem): void {
    const form = new FormData();
    form.append('item', new Blob([JSON.stringify({ name: item.name, price: item.price, category: item.category, description: item.description||'', available: item.available })], { type: 'application/json' }));
    this.http.put<any>(`${this.api}/menu/items/${item.id}`, form).subscribe({
      next: () => this.toast.success?.(item.available ? `"${item.name}" ON` : `"${item.name}" OFF`),
      error: () => { item.available = !item.available; this.toast.error('Failed to update.'); }
    });
  }

  saveEdit(): void {
    if (!this.editingItem) return;
    const ei = this.editingItem;
    const form = new FormData();
    form.append('item', new Blob([JSON.stringify({ name: ei.name, price: ei.price, category: ei.category, description: ei.description||'', available: ei.available })], { type: 'application/json' }));
    this.http.put<any>(`${this.api}/menu/items/${ei.id}`, form).subscribe({
      next: () => { this.toast.success?.('Updated!'); this.editingItem = null; this.loadMenu(); setTimeout(() => this.openSection(this.editSection), 600); },
      error: e => this.toast.error(e.status === 403 ? 'Login to admin first.' : 'Failed to update.')
    });
  }

  /** Permanently delete — backend force-deletes by nullifying FK first */
  deleteItem(item: NumberedMenuItem): void {
    if (this.isProtected(item.category)) { this.toast.error(`"${item.name}" is a core item — cannot delete.`); return; }
    if (!confirm(`Permanently delete "${item.name}"?\n\nPast order history will be preserved.`)) return;
    this.http.delete<any>(`${this.api}/menu/items/${item.id}`).subscribe({
      next: () => {
        this.toast.success?.(`"${item.name}" deleted!`);
        // Remove from local array, then re-sort and renumber using same category-grouped logic
        const remaining = this.allItems.filter(i => i.id !== item.id);
        const catMinId = new Map<string, number>();
        remaining.forEach(it => {
          const cat = it.category || 'Other';
          const cur = catMinId.get(cat);
          if (cur === undefined || it.id < cur) catMinId.set(cat, it.id);
        });
        const catOrder = Array.from(catMinId.entries()).sort((a,b) => a[1]-b[1]).map(e => e[0]);
        const grouped = new Map<string, NumberedMenuItem[]>();
        catOrder.forEach(c => grouped.set(c, []));
        remaining.forEach(it => { const c = it.category||'Other'; if (!grouped.has(c)) grouped.set(c,[]); grouped.get(c)!.push(it); });
        grouped.forEach(arr => arr.sort((a,b) => a.id-b.id));
        const sorted: NumberedMenuItem[] = [];
        catOrder.forEach(c => sorted.push(...(grouped.get(c)||[])));
        this.allItems = sorted.map((it, idx) => ({ ...it, serialNo: idx + 1 }));
        // Refresh section view instantly
        if (this.editSection && this.editSection !== '__new__') {
          this.editItems = this.allItems.filter(i => i.category === this.editSection);
          this.filteredEditItems = [...this.editItems];
        }
        this.applyMenuSearch();
        // Reload from server to confirm sync
        this.loadMenu();
        setTimeout(() => {
          if (this.editSection && this.editSection !== '__new__') this.openSection(this.editSection);
        }, 400);
      },
      error: e => this.toast.error('Delete failed: ' + (e.error?.message || e.message || 'Unknown error'))
    });
  }

  // ── Admin tab ─────────────────────────────────────────────
  openAdminTab(): void {
    this.settingTab = 'admin';
    this.adminError = ''; this.adminFpError = ''; this.adminFpSuccess = '';
    if (!this.adminLoggedIn) {
      this.adminView = 'login';
      this.adminUsername = '';
      this.adminPassword = '';
      this.adminShowPw   = false;
    }
  }

  doAdminLogin(): void {
    if (!this.adminUsername.trim() || !this.adminPassword.trim()) { this.adminError = 'Please fill in all fields'; return; }
    this.adminLoading = true; this.adminError = '';
    this.authSvc.login({ username: this.adminUsername, password: this.adminPassword }).subscribe({
      next: res => {
        this.adminLoading = false;
        if (res.success) {
          this.adminLoggedIn = true; this.adminUser = res.username; this.adminView = 'done';
          this.adminPassword = '';
          // Redirect directly to admin dashboard — no new tab
          window.location.href = '/admin/dashboard';
        } else {
          this.adminError = 'Invalid username or password.';
        }
      },
      error: e => {
        this.adminLoading = false;
        this.adminError = (e.status === 401 || e.status === 403) ? 'Invalid username or password.' : 'Cannot connect to server.';
      }
    });
  }

  doAdminLogout(): void {
    this.authSvc.logout().subscribe({
      next: () => {
        this.adminLoggedIn = false; this.adminUser = '';
        this.adminView = 'login';
        this.adminUsername = ''; this.adminPassword = ''; // always clear fields
        this.adminError = '';
        this.toast.success?.('Signed out.');
      },
      error: () => {
        this.adminLoggedIn = false; this.adminView = 'login';
        this.adminUsername = ''; this.adminPassword = '';
      }
    });
  }

  goAdminForgot(): void {
    this.adminView = 'forgot'; this.adminFpPhone=''; this.adminFpOtp=''; this.adminFpNew=''; this.adminFpConfirm='';
    this.adminFpError=''; this.adminFpSuccess=''; this.adminFpLoading=false;
  }

  adminSendOtp(): void {
    const ph = this.adminFpPhone.replace(/\D/g, '');
    if (ph.length < 10) { this.adminFpError = 'Enter a valid phone number'; return; }
    this.adminFpLoading = true; this.adminFpError = '';
    this.http.post<any>(`${this.api}/auth/otp/generate`, { phone: ph }).subscribe({
      next: res => {
        this.waOpen(this.adminWA, `Your Dosa Admin OTP: *${res.otp}*\nValid 5 minutes.`);
        this.adminView = 'otp'; this.adminFpLoading = false;
      },
      error: () => { this.adminFpError = 'Server error.'; this.adminFpLoading = false; }
    });
  }

  adminVerifyOtp(): void {
    if (!this.adminFpOtp.trim()) { this.adminFpError = 'Enter OTP'; return; }
    this.adminFpLoading = true; this.adminFpError = '';
    this.http.post<any>(`${this.api}/auth/otp/verify`, { phone: this.adminFpPhone.replace(/\D/g,''), otp: this.adminFpOtp.trim() }).subscribe({
      next: res => { if (res.valid) this.adminView = 'reset'; else this.adminFpError = res.reason||'Invalid OTP.'; this.adminFpLoading = false; },
      error: () => { this.adminFpError = 'Server error.'; this.adminFpLoading = false; }
    });
  }

  adminSaveNewPw(): void {
    if (this.adminFpNew.length < 4) { this.adminFpError = 'Min 4 characters'; return; }
    if (this.adminFpNew !== this.adminFpConfirm) { this.adminFpError = 'Passwords do not match'; return; }
    this.adminFpLoading = true; this.adminFpError = '';
    this.http.post<any>(`${this.api}/auth/change-password`, { phone: this.adminFpPhone.replace(/\D/g,''), otp: this.adminFpOtp, newPassword: this.adminFpNew }).subscribe({
      next: () => { this.adminFpSuccess = '✅ Password changed!'; this.adminFpLoading = false; setTimeout(() => { this.adminView='login'; this.adminFpSuccess=''; this.adminUsername=''; this.adminPassword=''; }, 2000); },
      error: () => { this.adminFpError = 'Failed to change password.'; this.adminFpLoading = false; }
    });
  }

  n(v: any): number { return v != null ? Number(v) : 0; }
}
