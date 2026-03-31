import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.services';
import { RoomService } from '../../../core/room.service';
import { RoomResponse } from '../../../core/models/room.model';
import { RoomTypeService } from '../../../core/room-type.service';
import { forkJoin } from 'rxjs';

export interface Booking {
  id: string;
  guestName: string;
  status: 'Checked-in' | 'Confirmed' | 'Due-Out' | 'PendingPay' | 'Maintenance';
  startDate: string;
  endDate: string;
  timeStr: string;
  isPaid: boolean;
  paidPercent?: number;
  maintenanceDesc?: string;
}

export interface Room {
  id: string;
  type: string;
  overallStatus: 'Ready' | 'Not Ready' | 'Maintenance';
  bookings: Booking[];
}

export interface Floor {
  name: string;
  rooms: Room[];
}

export interface TimelineDay {
  date: Date;
  dayOfWeek: string;
  dateStr: string;
  isToday: boolean;
}

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-dashboard.component.html',
  host: {
    class: 'flex-1 flex flex-col h-full overflow-hidden relative'
  },
  styles: [`
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #d1d1c1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #b1b1a1; }
    .booking-block-hover:hover {
      filter: brightness(1.1);
      cursor: pointer;
      transition: all 0.2s;
      transform: scale(1.01);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .sticky-header { position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); }
    .sticky-col { position: sticky; left: 0; z-index: 30; background: white; border-right: 1px solid #e5e3d7; }
  `]
})
export class StaffDashboardComponent implements OnInit {
  selectedDateString = this.formatLocalDate(new Date());
  currentWeekStart!: Date;
  timelineDays: TimelineDay[] = [];
  dateRangeText = '';
  floors: Floor[] = [];

  isLoading = false;
  errorMessage = '';
  bookingActionLoading = false;
  bookingActionError = '';
  availabilityFilterLoading = false;

  vacantCount = 0;
  occupiedCount = 0;
  notReadyCount = 0;
  maintenanceCount = 0;
  reservedCount = 0;
  dueOutCount = 0;
  pendingPaymentCount = 0;

  private roomsRaw: RoomResponse[] = [];
  private roomTypesRaw: any[] = [];
  private bookingsRaw: any[] = [];

  constructor(
    private roomService: RoomService,
    private roomTypeService: RoomTypeService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.processDateSelection(this.selectedDateString);
    this.loadRoomsAndInitialTimeline();
  }

  private loadRoomsAndInitialTimeline() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      rooms: this.roomService.getRooms({ page: 0, size: 500, sort: 'roomNumber,asc' }),
      roomTypes: this.roomTypeService.getRoomTypes()
    }).subscribe({
      next: ({ rooms, roomTypes }) => {
        this.roomsRaw = rooms?.data?.content ?? [];
        this.roomTypesRaw = roomTypes?.data ?? [];
        this.buildBookingModalRooms();
        this.loadTimelineBookings();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không tải được danh sách phòng.';
        this.isLoading = false;
      }
    });
  }

  private loadTimelineBookings() {
    this.isLoading = true;
    this.errorMessage = '';
    this.bookingService.getBookings({
      timeline_start: this.selectedDateString,
      timeline_days: 7
    }).subscribe({
      next: (bookingRes) => {
        this.bookingsRaw = this.normalizeBookings(bookingRes?.data);
        this.buildFloorTimeline();
        this.computeFooterStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không tải được danh sách booking.';
        this.buildFloorTimeline();
        this.computeFooterStats();
        this.isLoading = false;
      }
    });
  }

  private normalizeBookings(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw?.content && Array.isArray(raw.content)) return raw.content;
    return [];
  }

  processDateSelection(dateStr: string) {
    const selected = new Date(dateStr);
    const day = selected.getDay();
    const diff = selected.getDate() - day + (day === 0 ? -6 : 1);
    this.currentWeekStart = new Date(selected.setDate(diff));
    this.currentWeekStart.setHours(0, 0, 0, 0);
    this.generateTimelineDays();
  }

  onDateSelected(newDateStr: string) {
    if (newDateStr) {
      this.selectedDateString = newDateStr;
      this.processDateSelection(newDateStr);
      this.loadTimelineBookings();
    }
  }

  formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  prevWeek() {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    this.selectedDateString = this.formatLocalDate(newDate);
    this.processDateSelection(this.selectedDateString);
    this.loadTimelineBookings();
  }

  nextWeek() {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    this.selectedDateString = this.formatLocalDate(newDate);
    this.processDateSelection(this.selectedDateString);
    this.loadTimelineBookings();
  }

  generateTimelineDays() {
    this.timelineDays = [];
    const todayStr = new Date().toDateString();
    const daysArr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthsArr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      this.timelineDays.push({
        date: d,
        dayOfWeek: daysArr[d.getDay()],
        dateStr: `${monthsArr[d.getMonth()]} ${d.getDate()}`,
        isToday: d.toDateString() === todayStr
      });
    }

    const end = this.timelineDays[6]?.date ?? this.currentWeekStart;
    const startMonth = monthsArr[this.currentWeekStart.getMonth()];
    const startDate = this.currentWeekStart.getDate();
    const endMonth = monthsArr[end.getMonth()];
    const endDate = end.getDate();
    this.dateRangeText = `${startMonth} ${startDate} - ${endMonth} ${endDate}`;
  }

  private buildFloorTimeline() {
    const floorMap = new Map<number, Room[]>();
    const roomByType = new Map<string, Room[]>();

    this.roomsRaw.forEach((r) => {
      const room: Room = {
        id: r.roomNumber,
        type: r.roomTypeName,
        overallStatus: this.mapRoomStatus(r.status),
        bookings: []
      };
      if (!floorMap.has(r.floor)) floorMap.set(r.floor, []);
      floorMap.get(r.floor)!.push(room);

      const key = (r.roomTypeName || '').toLowerCase();
      if (!roomByType.has(key)) roomByType.set(key, []);
      roomByType.get(key)!.push(room);
    });

    this.bookingsRaw.forEach((b) => {
      const items = Array.isArray(b?.booking_items) ? b.booking_items : [];
      if (!items.length) return;

      items.forEach((item: any) => {
        const roomTypeName = (item?.room_type_name ?? '').toLowerCase();
        const candidates = roomByType.get(roomTypeName) ?? [];
        const target = candidates.find((r) => r.bookings.length < 3) ?? candidates[0];
        if (!target) return;
        target.bookings.push(this.mapBookingToTimeline(b, item));
      });
    });

    const sortedFloors = Array.from(floorMap.entries()).sort((a, b) => a[0] - b[0]);
    this.floors = sortedFloors.map(([floor, rooms]) => ({
      name: `Floor ${String(floor).padStart(2, '0')} — ${this.getFloorLabel(rooms)}`,
      rooms: rooms.sort((a, b) => Number(a.id) - Number(b.id))
    }));
  }

  private getFloorLabel(rooms: Room[]): string {
    const typeSet = new Set(rooms.map((r) => r.type));
    if (typeSet.size <= 1) return 'Rooms';
    return 'Mixed';
  }

  private mapBookingToTimeline(booking: any, item: any): Booking {
    const status = this.mapBookingStatus(booking?.status);
    const checkIn = item?.check_in ?? booking?.created_at ?? new Date().toISOString();
    const checkOut = item?.check_out ?? checkIn;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const isPaid = (booking?.payment_status || '').toUpperCase() === 'PAID';

    return {
      id: booking?.id || '',
      guestName: booking?.guest_name || 'Guest',
      status,
      startDate: inDate.toISOString(),
      endDate: outDate.toISOString(),
      timeStr: this.buildTimeLabel(inDate, outDate),
      isPaid
    };
  }

  private buildTimeLabel(checkIn: Date, checkOut: Date): string {
    const monthsArr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const inHH = String(checkIn.getHours()).padStart(2, '0');
    const inMM = String(checkIn.getMinutes()).padStart(2, '0');
    return `${inHH}:${inMM} • ${monthsArr[checkIn.getMonth()]} ${checkIn.getDate()} - ${checkOut.getDate()}`;
  }

  getBookingPositionStyles(booking: Booking): any {
    const weekStartMs = this.currentWeekStart.getTime();
    const startMs = new Date(booking.startDate).getTime();
    const endMs = new Date(booking.endDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    let startIdx = (startMs - weekStartMs) / dayMs;
    let duration = (endMs - startMs) / dayMs;

    if (startIdx < 0) {
      duration += startIdx;
      startIdx = 0;
    }
    if (startIdx + duration > 7) {
      duration = 7 - startIdx;
    }
    if (duration <= 0 || startIdx >= 7) {
      return { display: 'none' };
    }

    const leftPercent = (startIdx / 7) * 100;
    const widthPercent = (duration / 7) * 100;
    return {
      left: `calc(${leftPercent}% + 0.25rem)`,
      width: `calc(${widthPercent}% - 0.5rem)`
    };
  }

  getBookingBgClass(status: string) {
    switch (status) {
      case 'Checked-in': return 'bg-status-green';
      case 'Confirmed': return 'bg-status-purple';
      case 'Due-Out': return 'bg-status-orange';
      case 'PendingPay': return 'bg-status-grey';
      case 'Maintenance': return 'bg-status-red';
      default: return 'bg-slate-500';
    }
  }

  getRoomStatusIcon(status: string) {
    if (status === 'Ready') return 'verified';
    if (status === 'Not Ready') return 'schedule';
    if (status === 'Maintenance') return 'construction';
    return '';
  }

  getRoomStatusColor(status: string) {
    if (status === 'Ready') return 'text-status-green';
    if (status === 'Not Ready') return 'text-status-yellow';
    if (status === 'Maintenance') return 'text-status-red';
    return '';
  }

  getRoomBadgeClass(status: string) {
    if (status === 'Ready') return 'bg-green-100 text-green-700';
    if (status === 'Not Ready') return 'bg-yellow-100 text-yellow-700';
    if (status === 'Maintenance') return 'bg-red-100 text-red-700';
    return '';
  }

  private mapRoomStatus(status: string): 'Ready' | 'Not Ready' | 'Maintenance' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'MAINTENANCE') return 'Maintenance';
    if (normalized === 'DIRTY') return 'Not Ready';
    return 'Ready';
  }

  private mapBookingStatus(status: string): Booking['status'] {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'CHECKED_IN') return 'Checked-in';
    if (normalized === 'CONFIRMED') return 'Confirmed';
    if (normalized === 'COMPLETED') return 'Due-Out';
    if (normalized === 'PENDING') return 'PendingPay';
    return 'Confirmed';
  }

  isBookingModalOpen = false;
  todayString = this.formatLocalDate(new Date());

  bookingForm = {
    fullName: '',
    phone: '',
    email: '',
    idCard: '',
    numberOfGuests: 1,
    checkInDate: this.todayString,
    checkOutDate: this.formatLocalDate(new Date(Date.now() + 86400000 * 2)),
    nights: 2,
    roomFloorFilter: 'All Floors',
    roomTypeFilter: 'All Types',
    amenityFilter: 'All Amenities'
  };

  availableRoomsList: Array<{
    id: string;
    roomNumber: string;
    typeId: string;
    floor: string;
    type: string;
    cap: number;
    amenities: string[];
    status: string;
    price: number;
  }> = [];
  selectedRoomIds: string[] = [];
  floorOptions: string[] = [];
  roomTypeOptions: string[] = [];
  amenityOptions: string[] = [];
  unavailableRoomIds = new Set<string>();

  private buildBookingModalRooms() {
    const amenitiesByRoomTypeId = new Map<string, string[]>();
    this.roomTypesRaw.forEach((rt: any) => {
      const amenities = Array.isArray(rt?.amenities)
        ? rt.amenities.map((a: any) => String(a?.name ?? a?.code ?? '').trim()).filter(Boolean)
        : [];
      amenitiesByRoomTypeId.set(rt.id, amenities);
    });

    this.availableRoomsList = this.roomsRaw.map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      typeId: r.roomTypeId,
      floor: `Floor ${r.floor}`,
      type: r.roomTypeName,
      cap: r.roomTypeCapacity,
      amenities: amenitiesByRoomTypeId.get(r.roomTypeId) ?? [],
      status: r.status === 'AVAILABLE' ? 'READY' : r.status,
      price: r.roomTypeBasePrice
    }));
    this.floorOptions = Array.from(new Set(this.availableRoomsList.map((r) => r.floor))).sort();
    this.roomTypeOptions = Array.from(new Set(this.availableRoomsList.map((r) => r.type))).sort();
    this.amenityOptions = Array.from(
      new Set(this.availableRoomsList.flatMap((r) => r.amenities))
    ).sort();
    this.selectedRoomIds = [];
  }

  get filteredBookingRooms() {
    return this.availableRoomsList.filter((r) => {
      let fFloor = true;
      let fType = true;
      let fGuests = true;
      let fAmenity = true;
      let fAvailability = true;
      if (this.bookingForm.roomFloorFilter !== 'All Floors') {
        fFloor = r.floor === this.bookingForm.roomFloorFilter;
      }
      if (this.bookingForm.roomTypeFilter !== 'All Types') {
        fType = r.type === this.bookingForm.roomTypeFilter;
      }
      if (this.bookingForm.numberOfGuests > 0) {
        fGuests = r.cap >= this.bookingForm.numberOfGuests;
      }
      if (this.bookingForm.amenityFilter !== 'All Amenities') {
        fAmenity = r.amenities.includes(this.bookingForm.amenityFilter);
      }
      fAvailability = !this.unavailableRoomIds.has(r.id);
      return fFloor && fType && fGuests && fAmenity && fAvailability;
    });
  }

  get selectedRoomsDetails() {
    return this.availableRoomsList.filter((r) => this.selectedRoomIds.includes(r.id));
  }

  get totalBookingCapacity() {
    return this.selectedRoomsDetails.reduce((sum, r) => sum + r.cap, 0);
  }

  get totalRoomCharge() {
    const dailyTotal = this.selectedRoomsDetails.reduce((sum, r) => sum + r.price, 0);
    return dailyTotal * (this.bookingForm.nights || 1);
  }

  get selectedRoomCount() {
    return this.selectedRoomsDetails.length;
  }

  get vatAmount() {
    return Math.round(this.totalRoomCharge * 0.08);
  }

  get totalWithVat() {
    return this.totalRoomCharge + this.vatAmount;
  }

  updateNights() {
    if (!this.bookingForm.checkInDate || !this.bookingForm.checkOutDate) return;
    const inDate = new Date(this.bookingForm.checkInDate);
    const outDate = new Date(this.bookingForm.checkOutDate);
    const diffTime = outDate.getTime() - inDate.getTime();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      inDate.setDate(inDate.getDate() + 1);
      this.bookingForm.checkOutDate = this.formatLocalDate(inDate);
      diffDays = 1;
    }
    this.bookingForm.nights = diffDays;
    if (this.isBookingModalOpen) {
      this.refreshUnavailableRoomsByDateRange();
    }
  }

  toggleRoomSelection(roomId: string, status: string) {
    if (status !== 'READY' && status !== 'AVAILABLE') return;
    const index = this.selectedRoomIds.indexOf(roomId);
    if (index > -1) this.selectedRoomIds.splice(index, 1);
    else this.selectedRoomIds.push(roomId);
  }

  removeSelectedRoom(roomId: string) {
    this.selectedRoomIds = this.selectedRoomIds.filter((id) => id !== roomId);
  }

  openNewBooking() {
    this.isBookingModalOpen = true;
    this.refreshUnavailableRoomsByDateRange();
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

  saveBooking() {
    this.createBooking(false);
  }

  saveAndCheckIn() {
    this.createBooking(true);
  }

  private createBooking(withCheckIn: boolean) {
    this.bookingActionError = '';
    if (!this.bookingForm.checkInDate || !this.bookingForm.checkOutDate) {
      this.bookingActionError = 'Vui lòng chọn ngày check-in/check-out.';
      return;
    }
    if (this.selectedRoomIds.length === 0) {
      this.bookingActionError = 'Vui lòng chọn ít nhất 1 phòng cụ thể.';
      return;
    }

    const selectedRooms = this.availableRoomsList.filter((r) => this.selectedRoomIds.includes(r.id));
    if (selectedRooms.length === 0) {
      this.bookingActionError = 'Không tìm thấy phòng đã chọn.';
      return;
    }

    const checkIn = this.bookingForm.checkInDate;
    const checkOut = this.bookingForm.checkOutDate;
    const notes = [
      this.bookingForm.fullName ? `Guest: ${this.bookingForm.fullName}` : '',
      this.bookingForm.phone ? `Phone: ${this.bookingForm.phone}` : '',
      this.bookingForm.email ? `Email: ${this.bookingForm.email}` : '',
      this.bookingForm.idCard ? `ID: ${this.bookingForm.idCard}` : ''
    ].filter(Boolean).join(' | ');

    const bookingPayload = {
      channel: 'COUNTER',
      notes: notes || null,
      booking_items: selectedRooms.map((room) => ({
        room_type_id: room.typeId,
        pricing_mode: 'NIGHTLY',
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: Math.max(1, Math.min(room.cap, this.bookingForm.numberOfGuests))
      }))
    };

    this.bookingActionLoading = true;
    this.bookingService.createBooking(bookingPayload).subscribe({
      next: (createRes) => {
        const booking = createRes?.data;
        if (!withCheckIn) {
          this.bookingActionLoading = false;
          this.closeBookingModal();
          this.loadTimelineBookings();
          return;
        }

        const bookingItems: any[] = booking?.booking_items || [];
        const roomIdsByType = new Map<string, string[]>();
        selectedRooms.forEach((room) => {
          const queue = roomIdsByType.get(room.typeId) ?? [];
          queue.push(room.id);
          roomIdsByType.set(room.typeId, queue);
        });

        const assignments: Array<{ booking_item_id: string; room_id: string; notes: string }> = [];
        bookingItems.forEach((item) => {
          const typeId = item.room_type_id as string;
          const queue = roomIdsByType.get(typeId) ?? [];
          const assignedRoomId = queue.shift();
          roomIdsByType.set(typeId, queue);
          if (!assignedRoomId) {
            return;
          }
          assignments.push({
            booking_item_id: item.id,
            room_id: assignedRoomId,
            notes: 'Assigned by staff during check-in'
          });
        });

        if (!booking?.id || assignments.length !== bookingItems.length) {
          this.bookingActionLoading = false;
          this.bookingActionError = 'Không thể map đủ phòng cụ thể để check-in.';
          return;
        }

        const bookingId = booking.id as string;
        const confirm$ = this.bookingService.updateBookingStatus(bookingId, { status: 'CONFIRMED' });
        const checkIn$ = this.bookingService.checkInBooking(bookingId, { room_assignments: assignments });

        forkJoin([confirm$, checkIn$]).subscribe({
          next: () => {
            this.bookingActionLoading = false;
            this.closeBookingModal();
            this.loadTimelineBookings();
          },
          error: (err) => {
            this.bookingActionLoading = false;
            this.bookingActionError = this.resolveBookingActionError(err, 'Save & Check-in thất bại.');
          }
        });
      },
      error: (err) => {
        this.bookingActionLoading = false;
        this.bookingActionError = this.resolveBookingActionError(err, 'Tạo booking thất bại.');
      }
    });
  }

  private resolveBookingActionError(err: any, fallback: string): string {
    if (err?.status === 401) {
      localStorage.removeItem('access_token');
      this.router.navigate(['/login']);
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    return err?.error?.message || fallback;
  }

  private refreshUnavailableRoomsByDateRange() {
    const checkIn = this.bookingForm.checkInDate;
    const checkOut = this.bookingForm.checkOutDate;
    if (!checkIn || !checkOut) return;

    const nights = Math.max(1, this.bookingForm.nights || 1);
    this.availabilityFilterLoading = true;

    this.bookingService.getBookings({
      timeline_start: checkIn,
      timeline_days: nights
    }).subscribe({
      next: (res) => {
        const bookings = this.normalizeBookings(res?.data);
        const busyRoomIds = new Set<string>();

        bookings.forEach((booking: any) => {
          const status = String(booking?.status || '').toUpperCase();
          if (['CANCELLED', 'FAILED', 'COMPLETED', 'NO_SHOW'].includes(status)) {
            return;
          }

          if (booking?.room_id) {
            busyRoomIds.add(String(booking.room_id));
          }

          const items = Array.isArray(booking?.booking_items) ? booking.booking_items : [];
          items.forEach((item: any) => {
            if (item?.room_id) {
              busyRoomIds.add(String(item.room_id));
            }
          });
        });

        this.unavailableRoomIds = busyRoomIds;
        this.selectedRoomIds = this.selectedRoomIds.filter((id) => !this.unavailableRoomIds.has(id));
        this.availabilityFilterLoading = false;
      },
      error: () => {
        this.availabilityFilterLoading = false;
      }
    });
  }

  private computeFooterStats() {
    this.vacantCount = this.roomsRaw.filter((r) => r.status === 'AVAILABLE').length;
    this.occupiedCount = this.roomsRaw.filter((r) => r.status === 'OCCUPIED' || r.status === 'BOOKED').length;
    this.notReadyCount = this.roomsRaw.filter((r) => r.status === 'DIRTY').length;
    this.maintenanceCount = this.roomsRaw.filter((r) => r.status === 'MAINTENANCE').length;
    this.reservedCount = this.bookingsRaw.filter((b) => (b?.status || '').toUpperCase() === 'CONFIRMED').length;
    this.dueOutCount = this.bookingsRaw.filter((b) => (b?.status || '').toUpperCase() === 'COMPLETED').length;
    this.pendingPaymentCount = this.bookingsRaw.filter((b) => (b?.payment_status || '').toUpperCase() !== 'PAID').length;
  }
}

