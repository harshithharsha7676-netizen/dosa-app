import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../services/menu.service';
import { ToastService } from '../../../services/toast.service';
import { MenuItem, MenuItemRequest } from '../../../models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  apiBase     = environment.apiUrl.replace('/api', '');
  items:    MenuItem[] = [];
  filtered: MenuItem[] = [];
  loading    = true;
  searchQuery = '';

  modalOpen    = false;
  editingId: number | null = null;
  saving       = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  resetImage    = false;   // flag: user wants to clear the image

  // Category management: list from server + allow manual type
  categories: string[] = [];
  categoryInput = '';          // free-type field bound to category
  showCatDropdown = false;
  filteredCatOptions: string[] = [];

  form: MenuItemRequest = this.emptyForm();

  readonly PROTECTED_CATEGORIES = ['Butter Dosa', 'Schezwan Dosa', 'Cheese Dosa'];

  isProtected(category: string | null): boolean {
    return this.PROTECTED_CATEGORIES.includes(category || '');
  }

  constructor(private menuService: MenuService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.menuService.getAllItems().subscribe({
      next: items => {
        this.items = items;
        // Collect unique categories from server items
        const seen = new Set<string>();
        const cats: string[] = [];
        items.forEach(i => { if (i.category && !seen.has(i.category)) { seen.add(i.category); cats.push(i.category); } });
        this.categories = cats;
        this.applySearch();
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to load menu items'); this.loading = false; }
    });
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.category ?? '').toLowerCase().includes(q)
    );
  }

  // ── Category autocomplete ─────────────────────────────────
  onCatInput(): void {
    const q = this.categoryInput.toLowerCase();
    // When adding a new item: never show protected categories as options
    // When editing an existing item in a protected category: allow (already set)
    const showProtected = !!this.editingId && this.PROTECTED_CATEGORIES.includes(this.form.category);
    this.filteredCatOptions = this.categories.filter(c => {
      if (!showProtected && this.PROTECTED_CATEGORIES.includes(c)) return false;
      return c.toLowerCase().includes(q);
    });
    this.showCatDropdown = this.filteredCatOptions.length > 0;
    this.form.category = this.categoryInput;  // allow free typing
  }

  selectCat(cat: string): void {
    this.categoryInput = cat;
    this.form.category = cat;
    this.showCatDropdown = false;
  }

  // ── Modal ─────────────────────────────────────────────────
  openAdd(): void {
    this.editingId     = null;
    this.form          = this.emptyForm();
    this.selectedImage = null;
    this.imagePreview  = null;
    this.resetImage    = false;
    this.categoryInput = '';
    this.showCatDropdown = false;
    this.modalOpen     = true;
  }

  openEdit(item: MenuItem): void {
    this.editingId = item.id;
    this.form = {
      name:        item.name,
      price:       Number(item.price),
      category:    item.category ?? '',
      description: item.description ?? '',
      available:   item.available
    };
    this.categoryInput   = item.category ?? '';
    this.selectedImage   = null;
    this.resetImage      = false;
    this.imagePreview    = item.imageUrl ? this.imageUrl(item.imageUrl) : null;
    this.showCatDropdown = false;
    this.modalOpen       = true;
  }

  closeModal(): void {
    this.modalOpen       = false;
    this.showCatDropdown = false;
  }

  // Reset everything back to blank for this item
  resetItem(): void {
    if (!confirm('Reset this item? Name, price, description and image will be cleared.')) return;
    this.form.name        = '';
    this.form.price       = 0;
    this.form.description = '';
    this.selectedImage    = null;
    this.imagePreview     = null;
    this.resetImage       = true;   // tell backend to clear image
  }

  onImageSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedImage = file;
    this.resetImage    = false;
    const reader = new FileReader();
    reader.onload = e => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview  = null;
    this.resetImage    = true;
  }

  save(): void {
    if (!this.form.name?.trim()) { this.toast.error('Name is required'); return; }
    if (!this.form.price || this.form.price <= 0) { this.toast.error('Price must be > 0'); return; }

    this.form.category = this.categoryInput || this.form.category;

    this.saving = true;

    // If user wants to clear image, pass resetImage flag in JSON
    const req = { ...this.form, resetImage: this.resetImage };

    const obs = this.editingId
      ? this.menuService.updateItem(this.editingId, req as any, this.resetImage ? undefined : (this.selectedImage ?? undefined))
      : this.menuService.createItem(this.form, this.selectedImage ?? undefined);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Item updated!' : 'Item added!');
        this.closeModal();
        this.load();
        this.saving = false;
      },
      error: () => { this.toast.error('Failed to save item'); this.saving = false; }
    });
  }

  toggle(item: MenuItem): void {
    this.menuService.toggleAvailability(item.id).subscribe({
      next:  () => { item.available = !item.available; this.toast.success('Availability updated'); },
      error: () => this.toast.error('Failed to update availability')
    });
  }

  delete(item: MenuItem): void {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    this.menuService.deleteItem(item.id).subscribe({
      next:  () => { this.toast.success('Item deleted'); this.load(); },
      error: () => this.toast.error('Failed to delete item')
    });
  }

  imageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = this.apiBase.replace(/\/+$/, '');
    const p    = '/' + path.replace(/^\/+/, '');
    return base + p;
  }

  asNumber(v: number | string | null | undefined): number {
    return v != null ? Number(v) : 0;
  }

  private emptyForm(): MenuItemRequest {
    return { name: '', price: 0, category: '', description: '', available: true };
  }
}
