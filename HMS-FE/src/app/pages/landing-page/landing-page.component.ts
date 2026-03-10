import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  // Trạng thái đăng nhập
  isLoggedIn: boolean = false; 
  
  // Thông tin user (giả lập)
  user = {
    name: 'Alex Johnson',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC36ol4gnd1K2j2EP1d733wysKNBLIeCetMOG_lzEScjF2jTN3PAeAAJzDwRMs2xvpMRR9tCcwzPJ9f5CxxbCJQKWDCgZ7rpM4qNJKc75Ju__Mi8KXzKB4Y0tqjseqZyreXqsxFCkPbtoAK5H-Spo3n1crBaabozCa_Fzp7dniXnGNIHKgQCvSn8cPKfl4btQeSsKINbSrE4u2wFo0snd66HXmpFyn-AIxYs4XspBzNWIkoYN6DkLXwHRCtkcewqrSwk2JUhhlo3sn5',
    level: 'Premium Member'
  };

  rooms = [
    {
      title: 'Grand Suite',
      price: 800,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974',
      desc: 'Experience ultimate comfort in our Grand Suite, featuring panoramic ocean views.',
      beds: '1 King',
      guests: 2,
      features: ['wifi', 'pool']
    },
    {
      title: 'Royal Villa',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070',
      desc: 'A private oasis with its own infinity pool and dedicated butler service.',
      beds: '2 King',
      guests: 4,
      features: ['wifi', 'pool', 'beach_access']
    },
    {
      title: 'Ocean Penthouse',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1974',
      desc: 'The pinnacle of luxury with 360-degree views and unmatched elegance.',
      beds: '3 King',
      guests: 6,
      features: ['wifi', 'pool', 'room_service']
    }
  ];

  features = [
    { icon: 'verified_user', title: 'Premium Security', desc: '24/7 top-tier security ensuring your privacy.' },
    { icon: 'diamond', title: 'Exclusive Access', desc: 'Access to world-class facilities and private beaches.' },
    { icon: 'restaurant_menu', title: 'Fine Dining', desc: 'Michelin-starred chefs preparing masterpieces.' },
    { icon: 'support_agent', title: '24/7 Concierge', desc: 'Dedicated staff ready to fulfill every request.' }
  ];

  toggleLogin() {
    this.isLoggedIn = !this.isLoggedIn;
  }
}