import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Booking {
  id: string;
  guestName: string;
  status: 'Checked-in' | 'Confirmed' | 'Due-Out' | 'PendingPay' | 'Maintenance';
  startDate: string; // '2023-10-24'
  endDate: string; // '2023-10-26'
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
  
  // Main Date reference
  selectedDateString: string = '2023-10-24'; // Using the mock date range starting point
  currentWeekStart!: Date;
  timelineDays: TimelineDay[] = [];
  dateRangeText: string = '';

  floors: Floor[] = [
    {
      name: 'Floor 01 — Suites',
      rooms: [
        {
          id: '101',
          type: 'King Executive',
          overallStatus: 'Ready',
          bookings: [
            {
              id: 'BK-72911',
              guestName: 'Alexander Hamilton',
              status: 'Confirmed',
              startDate: '2023-10-24T14:00:00',
              endDate: '2023-10-26T11:00:00',
              timeStr: '14:00 • OCT 24 - 26',
              isPaid: true
            }
          ]
        },
        {
          id: '102',
          type: 'Double Queen',
          overallStatus: 'Not Ready',
          bookings: [
            {
              id: 'BK-99420',
              guestName: 'Dr. Sarah Connor',
              status: 'Checked-in',
              startDate: '2023-10-25T15:30:00', // Starts halfway through the 25th
              endDate: '2023-10-28T11:00:00',
              timeStr: '15:30 • OCT 25 - 28',
              isPaid: false,
              paidPercent: 70
            }
          ]
        }
      ]
    },
    {
      name: 'Floor 02 — Premium',
      rooms: [
        {
          id: '201',
          type: 'Ocean Terrace',
          overallStatus: 'Maintenance',
          bookings: [
            {
              id: 'BK-1102',
              guestName: 'James Moriarty',
              status: 'PendingPay',
              startDate: '2023-10-24T00:00:00',
              endDate: '2023-10-25T11:00:00',
              timeStr: '',
              isPaid: false
            },
            {
              id: 'M-001',
              guestName: 'Preventative Maintenance',
              status: 'Maintenance',
              startDate: '2023-10-26T00:00:00',
              endDate: '2023-10-28T18:00:00',
              timeStr: '',
              isPaid: false,
              maintenanceDesc: 'HVAC Filter & Balcony Seal Check'
            }
          ]
        },
        {
          id: '202',
          type: 'Presidential',
          overallStatus: 'Ready',
          bookings: [
            {
              id: 'BK-00007',
              guestName: 'VIP: John Wick',
              status: 'Due-Out',
              startDate: '2023-10-24T12:00:00',
              endDate: '2023-10-26T11:00:00',
              timeStr: 'OUT: OCT 26 @ 11:00',
              isPaid: false
            }
          ]
        }
      ]
    }
  ];

  ngOnInit() {
    this.processDateSelection(this.selectedDateString);
  }

  processDateSelection(dateStr: string) {
    const selected = new Date(dateStr);
    
    // Find Monday of that week
    const day = selected.getDay();
    const diff = selected.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    
    this.currentWeekStart = new Date(selected.setDate(diff));
    this.currentWeekStart.setHours(0,0,0,0);
    
    this.generateTimelineDays();
  }

  onDateSelected(newDateStr: string) {
    if (newDateStr) {
      this.selectedDateString = newDateStr;
      this.processDateSelection(newDateStr);
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
  }

  nextWeek() {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    this.selectedDateString = this.formatLocalDate(newDate);
    this.processDateSelection(this.selectedDateString);
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

    // Update Date Range Text (e.g., OCT 24 - OCT 30 or OCT 30 - NOV 5)
    const end = this.timelineDays[6].date;
    const startMonth = monthsArr[this.currentWeekStart.getMonth()];
    const startDate = this.currentWeekStart.getDate();
    const endMonth = monthsArr[end.getMonth()];
    const endDate = end.getDate();
    
    this.dateRangeText = `${startMonth} ${startDate} - ${endMonth} ${endDate}`;
  }


  getBookingPositionStyles(booking: Booking): any {
    const weekStartMs = this.currentWeekStart.getTime();
    const startMs = new Date(booking.startDate).getTime();
    const endMs = new Date(booking.endDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // start idx relative to the week
    let startIdx = (startMs - weekStartMs) / dayMs;
    let duration = (endMs - startMs) / dayMs;

    // Clip logic if booking starts before the week
    if (startIdx < 0) {
      duration += startIdx; // reduce duration
      startIdx = 0; // clip to left edge
    }
    
    // Clip logic if booking extends beyond the week
    if (startIdx + duration > 7) {
      duration = 7 - startIdx;
    }

    // Hide if completely outside the week
    if (duration <= 0 || startIdx >= 7) {
      return { 'display': 'none' };
    }

    // Calculate percentages for flexible columns within the grid (which is 100% width)
    const leftPercent = (startIdx / 7) * 100;
    const widthPercent = (duration / 7) * 100;
    
    return {
      'left': `calc(${leftPercent}% + 0.25rem)`,
      'width': `calc(${widthPercent}% - 0.5rem)`
    };
  }

  getBookingBgClass(status: string) {
    switch(status) {
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

  isBookingModalOpen = false;
  todayString = this.formatLocalDate(new Date());
  
  bookingForm = {
    fullName: '',
    phone: '',
    email: '',
    idCard: '',
    type: 'Daily',
    checkInDate: this.todayString,
    checkOutDate: this.formatLocalDate(new Date(Date.now() + 86400000 * 2)),
    nights: 2,
    roomFloorFilter: 'All Floors',
    roomTypeFilter: 'All Types'
  };

  availableRoomsList = [
    { id: '101', floor: '1st', type: 'King Deluxe', cap: 2, status: 'READY', price: 1200000 },
    { id: '102', floor: '1st', type: 'King Deluxe', cap: 2, status: 'READY', price: 1200000 },
    { id: '104', floor: '1st', type: 'Suite', cap: 4, status: 'DIRTY', price: 2500000 },
    { id: '201', floor: '2nd', type: 'Ocean Terrace', cap: 2, status: 'READY', price: 1800000 },
    { id: '205', floor: '2nd', type: 'Double Queen', cap: 4, status: 'READY', price: 2000000 },
  ];

  selectedRoomIds: string[] = ['101'];

  get filteredBookingRooms() {
    return this.availableRoomsList.filter(r => {
      let fFloor = true;
      let fType = true;
      if (this.bookingForm.roomFloorFilter !== 'All Floors') {
        fFloor = r.floor === this.bookingForm.roomFloorFilter;
      }
      if (this.bookingForm.roomTypeFilter !== 'All Types') {
        fType = r.type === this.bookingForm.roomTypeFilter;
      }
      return fFloor && fType;
    });
  }

  get selectedRoomsDetails() {
    return this.availableRoomsList.filter(r => this.selectedRoomIds.includes(r.id));
  }

  get totalBookingCapacity() {
    return this.selectedRoomsDetails.reduce((sum, r) => sum + r.cap, 0);
  }

  get totalRoomCharge() {
    const dailyTotal = this.selectedRoomsDetails.reduce((sum, r) => sum + r.price, 0);
    return dailyTotal * (this.bookingForm.nights || 1);
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
  }

  toggleRoomSelection(roomId: string, status: string) {
    if (status !== 'READY') return;
    const index = this.selectedRoomIds.indexOf(roomId);
    if (index > -1) {
      this.selectedRoomIds.splice(index, 1);
    } else {
      this.selectedRoomIds.push(roomId);
    }
  }

  removeSelectedRoom(roomId: string) {
    this.selectedRoomIds = this.selectedRoomIds.filter(id => id !== roomId);
  }

  openNewBooking() {
    this.isBookingModalOpen = true;
  }
  
  closeBookingModal() {
    this.isBookingModalOpen = false;
  }
  
  saveBooking() {
    alert('Booking saved!');
    this.closeBookingModal();
  }
}
