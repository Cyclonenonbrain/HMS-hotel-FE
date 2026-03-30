import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PricingRule {
  id: string;
  name: string;
  roomType: string;
  adjustmentStr: string;
  adjustmentType: 'Markup' | 'Discount';
  validFrom: string;
  validUntil: string;
  status: 'Active' | 'Upcoming' | 'Expired';
}

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.component.html'
})
export class PricingComponent implements OnInit {
  pricingRules: PricingRule[] = [
    { id: 'PRC-1001', name: 'Summer High Season', roomType: 'All Types', adjustmentStr: '+20%', adjustmentType: 'Markup', validFrom: '2024-06-01', validUntil: '2024-08-31', status: 'Upcoming' },
    { id: 'PRC-1002', name: 'Holiday Special', roomType: 'Suite', adjustmentStr: '-15%', adjustmentType: 'Discount', validFrom: '2023-12-20', validUntil: '2024-01-05', status: 'Expired' },
    { id: 'PRC-1003', name: 'Weekend Surge', roomType: 'Double Queen', adjustmentStr: '+10%', adjustmentType: 'Markup', validFrom: '2023-11-01', validUntil: '2024-11-01', status: 'Active' }
  ];

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  
  formData: any = {};
  ruleToDelete: PricingRule | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;

  ngOnInit() {}

  openAddModal() {
    this.modalMode = 'add';
    this.formData = { name: '', roomType: 'All Types', adjustmentStr: '', adjustmentType: 'Markup', validFrom: '', validUntil: '', status: 'Active' };
    this.showModal = true;
  }

  openEditModal(rule: PricingRule) {
    this.modalMode = 'edit';
    this.formData = { ...rule };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveModal() {
    if (this.modalMode === 'add') {
      const newId = 'PRC-100' + (this.pricingRules.length + 1);
      this.pricingRules.push({ id: newId, ...this.formData });
      this.showToast('success', 'Pricing Rule added successfully!');
    } else {
      const idx = this.pricingRules.findIndex(r => r.id === this.formData.id);
      if (idx > -1) {
        this.pricingRules[idx] = { ...this.formData };
        this.showToast('success', 'Pricing Rule updated successfully!');
      }
    }
    this.closeModal();
  }

  openDeleteDialog(rule: PricingRule) {
    this.ruleToDelete = rule;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.ruleToDelete = null;
  }

  confirmDelete() {
    if (this.ruleToDelete) {
      this.pricingRules = this.pricingRules.filter(r => r.id !== this.ruleToDelete!.id);
      this.showToast('success', 'Pricing Rule deleted successfully!');
      this.closeDeleteDialog();
    }
  }

  showToast(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
